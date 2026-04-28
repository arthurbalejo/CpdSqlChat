# AcademIA — Assistente de Evasão UFSM

Sistema de perguntas e respostas em linguagem natural sobre dados de evasão universitária da UFSM. Permite que gestores, coordenadores e pesquisadores consultem o banco institucional sem precisar escrever SQL.

---

## Motivação

O CPD da UFSM mantém uma base de dados com informações de evasão (desistência, abandono, trancamento) por curso, semestre e centro. Consultar esses dados exige conhecimento de SQL e acesso direto ao banco — barreiras que limitam o uso por quem mais precisa dos dados.

A proposta do projeto é permitir que qualquer pessoa faça perguntas em português natural — como _"Qual curso teve mais evasões em 2023?"_ ou _"Compare a evasão de Ciência da Computação nos últimos dois anos"_ — e receba respostas claras, mantendo o histórico da conversa para perguntas de acompanhamento.

---

## Arquitetura

```
Usuário (browser)
  │  pergunta em português
  ▼
Frontend (Next.js 16)
  │  POST /api/pergunta  { pergunta, chat_id }
  ▼
Backend (FastAPI)
  │
  ├─► PostgreSQL — usuários, chats e histórico de mensagens
  │
  ├─► LLM (GPT-4): interpreta a pergunta + histórico → extrai filtros
  ├─► LLM (GPT-4): gera SQL com base nos filtros e no schema
  ├─► IBM DB2 (UFSM): executa a query
  └─► LLM (GPT-4 / GPT-3.5): formata o resultado → resposta em português
  │
  ▼
Frontend exibe resposta e salva no histórico do chat
```

---

## Funcionalidades

- **Perguntas em linguagem natural** sobre a tabela `BEEIA.Cursos_Totais_IA` do IBM DB2
- **Histórico de conversas** — cada chat mantém contexto entre perguntas
- **Múltiplos chats** — crie, renomeie e delete conversas independentes
- **Autenticação completa** — cadastro, login JWT, recuperação de senha por e-mail
- **Tema claro/escuro** — persistido no localStorage
- **Interface responsiva** — sidebar colapsável no mobile

---

## Estrutura do Projeto

```
CpdSqlChat/
├── docker-compose.yml         # Sobe Postgres + backend + frontend
│
├── backend/
│   ├── main.py                # Entrypoint FastAPI, registro de routers
│   ├── models.py              # Modelos SQLAlchemy (Usuario, Chat, Mensagem, …)
│   ├── constants.py           # Lista dos 43 cursos da UFSM
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py            # /auth/* — login, registro, recuperação de senha
│   │   ├── chat.py            # /api/chat* — CRUD de chats
│   │   ├── pergunta.py        # /api/pergunta — processamento da pergunta
│   │   └── autocomplete.py    # /api/autocomplete — sugestão de cursos
│   └── services/
│       ├── database.py        # Conexão IBM DB2 via SQLAlchemy (ibm_db_sa)
│       ├── database_pg.py     # Conexão PostgreSQL + criação das tabelas
│       ├── llm.py             # Pipeline GPT-4: interpreta → SQL → formata
│       ├── auth.py            # JWT, hash de senha, token de recuperação
│       └── email.py           # Envio de e-mail para recuperação de senha
│
├── frontend/
│   ├── app/
│   │   ├── chat/page.tsx      # Interface principal com sidebar de chats
│   │   ├── login/             # Página de login
│   │   ├── register/          # Página de cadastro
│   │   ├── esqueci-senha/     # Solicitação de recuperação de senha
│   │   ├── resetar-senha/     # Redefinição via token
│   │   ├── layout.tsx         # Layout raiz (fonte, tema inicial)
│   │   ├── providers.tsx      # Contexto de tema + TooltipProvider
│   │   └── globals.css        # Tailwind v4 + paleta navy/orange
│   ├── lib/
│   │   └── api.ts             # Funções fetch para todos os endpoints
│   └── components/ui/         # Componentes shadcn/ui
│
└── start.sh                   # Sobe back e front localmente (sem Docker)
```

---

## Tecnologias

| Camada      | Tecnologia                                                      |
|-------------|-----------------------------------------------------------------|
| Frontend    | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui   |
| Backend     | Python 3.12, FastAPI, SQLAlchemy, Uvicorn                       |
| LLM         | OpenAI GPT-4 via LangChain                                      |
| Banco UFSM  | IBM DB2 via `ibm_db_sa`                                         |
| Banco App   | PostgreSQL 16 (usuários, chats, mensagens)                      |
| Auth        | JWT (`python-jose`), bcrypt, recuperação via e-mail             |
| Deploy      | Docker Compose                                                  |

---

## Pré-requisitos

- Python 3.12+
- Node.js 18+
- Docker e Docker Compose (para subir via container)
- Acesso ao banco IBM DB2 da UFSM (rede interna ou VPN)
- Chave de API da OpenAI

---

## Configuração

### Variáveis de ambiente — `backend/.env`

```env
# OpenAI
OPENAI_API_KEY=sk-...

# IBM DB2 (dados UFSM)
DB_HOST=<host do DB2>
DB_PORT=50000
DB_NAME=BEE
DB_USER=<usuario>
DB_PASS=<senha>

# PostgreSQL (dados da aplicação)
DATABASE_URL=postgresql://beeai_user:suasenha123@localhost:5432/beeai

# JWT
SECRET_KEY=<segredo_longo_e_aleatorio>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# E-mail (recuperação de senha)
EMAIL_HOST=smtp.exemplo.com
EMAIL_PORT=587
EMAIL_USER=<email>
EMAIL_PASS=<senha>
```

> O IBM DB2 CLI driver está incluído em `backend/clidriver/`. O pacote `ibm_db` usa esse driver automaticamente.

---

## Executando com Docker

```bash
# Sobe Postgres + backend + frontend
docker-compose up --build
```

| Serviço   | URL                      |
|-----------|--------------------------|
| Frontend  | http://localhost:3000    |
| Backend   | http://localhost:5000    |
| Postgres  | localhost:5432           |

---

## Executando localmente

### 1. Postgres (via Docker)

```bash
docker-compose up postgres -d
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Linux/macOS
# venv\Scripts\activate       # Windows

pip install -r requirements.txt
uvicorn main:app --reload --port 5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### Tudo de uma vez (sem Docker)

```bash
./start.sh
```

---

## API — Endpoints principais

### Autenticação

| Método | Rota                    | Descrição                          |
|--------|-------------------------|------------------------------------|
| POST   | `/auth/register`        | Criar conta                        |
| POST   | `/auth/login`           | Login — retorna JWT                |
| GET    | `/auth/me`              | Dados do usuário logado            |
| POST   | `/auth/esqueci-senha`   | Envia e-mail com token de reset    |
| POST   | `/auth/resetar-senha`   | Redefine senha via token           |

### Chats

| Método | Rota                    | Descrição                          |
|--------|-------------------------|------------------------------------|
| POST   | `/api/chat`             | Criar novo chat                    |
| GET    | `/api/chats`            | Listar chats do usuário            |
| GET    | `/api/chat/{id}`        | Buscar chat com mensagens          |
| PATCH  | `/api/chat/{id}`        | Renomear chat                      |
| DELETE | `/api/chat/{id}`        | Deletar chat e mensagens           |

### Pergunta

| Método | Rota                    | Descrição                                      |
|--------|-------------------------|------------------------------------------------|
| POST   | `/api/pergunta`         | Processa pergunta com contexto do chat         |
| GET    | `/api/autocomplete`     | Sugestão de cursos pelo termo buscado          |

**Exemplo — POST `/api/pergunta`:**

```json
// Request
{ "pergunta": "Qual curso teve mais evasões em 2023?", "chat_id": 42 }

// Response
{
  "pergunta": "Qual curso teve mais evasões em 2023?",
  "resposta": "No 1º semestre de 2023, o curso com maior número de evasões foi...",
  "sql": "SELECT NOME_CURSO, TOTAL_EVASOES FROM BEEIA.Cursos_Totais_IA WHERE ..."
}
```

> Todas as rotas de chat e pergunta exigem `Authorization: Bearer <token>`.

---

## Banco de Dados

### PostgreSQL — dados da aplicação

| Tabela              | Colunas principais                                              |
|---------------------|-----------------------------------------------------------------|
| `usuarios`          | id, nome, email, senha_hash, ativo, criado_em                  |
| `chats`             | id, usuario_id, titulo, criado_em, atualizado_em               |
| `mensagens`         | id, chat_id, role (user/assistant), conteudo, criado_em        |
| `tokens_recuperacao`| id, usuario_id, token, usado, expira_em                        |

As tabelas são criadas automaticamente pelo SQLAlchemy ao iniciar o backend.

### IBM DB2 — dados UFSM

Tabela consultada: `BEEIA.Cursos_Totais_IA`

| Coluna                    | Descrição                               |
|---------------------------|-----------------------------------------|
| NOME_CURSO                | Nome completo do curso                  |
| SIGLA_CENTRO              | Centro acadêmico (CAL, CCNE, CCR…)     |
| ANO                       | Ano letivo (2021–2024)                  |
| SEMESTRE                  | Semestre (1 ou 2)                       |
| TOTAL_MATRICULADOS        | Alunos matriculados                     |
| TOTAL_EVASOES             | Total de evasões                        |
| TOTAL_CALOUROS            | Total de ingressantes                   |
| TOTAL_EGRESSOS            | Total de formandos                      |
| PERCENTUAL_ACERTOS_EVASAO | Taxa de acerto do modelo preditivo      |

---

## Como o LLM funciona (sem fine-tuning)

O GPT-4 é acionado em três etapas encadeadas, todas via prompts com o schema e exemplos embutidos:

1. **Interpretação** — extrai filtros da pergunta (curso, ano, semestre, centro) e corrige o nome do curso para o mais próximo da lista oficial de 43 cursos
2. **Geração de SQL** — com base nos filtros, no schema da tabela e no histórico do chat, gera a query SQL para o DB2
3. **Formatação** — recebe o resultado bruto e transforma em texto legível em português

O histórico das mensagens anteriores do chat é enviado junto ao prompt da etapa 2, permitindo perguntas de acompanhamento como _"e no semestre anterior?"_ ou _"qual desses tem o maior percentual?"_.
