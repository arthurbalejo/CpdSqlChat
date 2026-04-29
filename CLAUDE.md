# CLAUDE.md — AcademIA

## 1. Visão Geral do Projeto

**AcademIA** é um assistente de chat inteligente para análise de evasão universitária na UFSM (Universidade Federal de Santa Maria). O usuário faz perguntas em linguagem natural sobre dados de evasão (percentuais, cursos, anos, semestres), o backend traduz a pergunta para SQL via LLM (GPT-4), consulta um banco IBM DB2, e retorna uma resposta formatada em português.

O sistema possui autenticação completa (registro, login, recuperação de senha por email) e histórico de conversas persistido por usuário.

---

## 2. Arquitetura e Stack Tecnológico

```
[Next.js 16 / React 19]  →  [FastAPI / Python]  →  [IBM DB2]   (dados de evasão)
      frontend                   backend           └→ [PostgreSQL] (usuários, chats)
      :3000                       :5000
```

### Backend
- **FastAPI** (Python) — framework HTTP
- **SQLAlchemy 2** — ORM para PostgreSQL (usuários/chats) e IBM DB2 (dados de evasão)
- **IBM DB2** — banco de dados principal com dados de evasão (`BEEIA.Cursos_Totais_IA`)
- **PostgreSQL** — banco de dados de suporte para usuários, chats e mensagens
- **LangChain + OpenAI GPT-4** — geração de SQL e formatação de respostas
- **python-jose + bcrypt** — JWT e hashing de senhas
- **aiosmtplib** — envio de email assíncrono via Gmail SMTP

### Frontend
- **Next.js 16.2.4** com App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Shadcn/ui** (estilo `radix-nova`) com componentes Radix UI
- **js-cookie** — armazenamento de token JWT em cookies
- **lucide-react** — ícones

---

## 3. Estrutura de Pastas

```
CpdSqlChat/
├── docker-compose.yml          # Sobe postgres + backend + frontend
├── start.sh                    # Script alternativo para dev local (venv)
├── backend/
│   ├── main.py                 # Entry point FastAPI, registra todos os routers
│   ├── models.py               # Modelos SQLAlchemy (Usuario, Conversa, Chat, Mensagem, TokenRecuperacao)
│   ├── constants.py            # Lista de todos os cursos da UFSM (usada no autocomplete e no prompt do LLM)
│   ├── requirements.txt        # Dependências Python
│   ├── .env                    # Variáveis de ambiente (não commitado)
│   ├── clidriver/              # IBM DB2 CLI driver (binário)
│   ├── routes/
│   │   ├── auth.py             # Rotas de autenticação (register, login, me, esqueci-senha, resetar-senha)
│   │   ├── pergunta.py         # Rota principal: recebe pergunta → gera SQL → consulta DB2 → formata resposta
│   │   ├── chat.py             # CRUD de chats e listagem de mensagens
│   │   └── autocomplete.py     # Sugestão de cursos baseada em texto parcial
│   └── services/
│       ├── llm.py              # Lógica LLM: interpretar_pergunta(), gerar_sql(), formatar_resposta()
│       ├── auth.py             # Utilitários JWT e bcrypt
│       ├── database.py         # Engine SQLAlchemy para IBM DB2
│       ├── database_pg.py      # Engine SQLAlchemy para PostgreSQL + criação automática de tabelas
│       └── email.py            # Envio de email de recuperação de senha via SMTP Gmail
└── frontend/
    ├── app/
    │   ├── layout.tsx          # Layout raiz: fonts Geist, script anti-flash dark mode
    │   ├── providers.tsx       # ThemeProvider (dark/light) + TooltipProvider
    │   ├── globals.css         # Variáveis CSS do tema, cores navy e orange
    │   ├── page.tsx            # Redireciona para /chat ou /login conforme cookie
    │   ├── chat/page.tsx       # Página principal do chat (sidebar + mensagens + input)
    │   ├── login/page.tsx      # Formulário de login
    │   ├── register/page.tsx   # Formulário de cadastro
    │   ├── esqueci-senha/page.tsx   # Solicitação de recuperação de senha
    │   └── resetar-senha/page.tsx   # Redefinição de senha com token
    ├── components/ui/          # Componentes Shadcn instalados (ver seção 7)
    ├── lib/
    │   ├── api.ts              # Todas as chamadas fetch ao backend (centralizado)
    │   └── utils.ts            # cn() do Shadcn (clsx + tailwind-merge)
    └── package.json
```

---

## 4. Schema do Banco de Dados (PostgreSQL)

### `usuarios`
| Coluna       | Tipo          | Descrição                        |
|-------------|---------------|----------------------------------|
| id           | Integer PK    |                                  |
| nome         | String(100)   | Nome completo                    |
| email        | String(200)   | Único, indexado                  |
| senha_hash   | String(255)   | bcrypt                           |
| ativo        | Boolean       | Default: True                    |
| criado_em    | DateTime      | UTC                              |

### `conversas`
Tabela legada — mantida mas não usada ativamente (o fluxo atual usa `chats`/`mensagens`).

| Coluna      | Tipo       | Descrição             |
|-------------|------------|-----------------------|
| id          | Integer PK |                       |
| usuario_id  | FK usuarios|                       |
| pergunta    | Text       |                       |
| resposta    | Text       |                       |
| sql_gerado  | Text       | Nullable              |
| criado_em   | DateTime   |                       |

### `chats`
| Coluna        | Tipo          | Descrição                    |
|--------------|---------------|------------------------------|
| id            | Integer PK    |                              |
| usuario_id    | FK usuarios   |                              |
| titulo        | String(200)   | Default: "Novo Chat"         |
| criado_em     | DateTime      |                              |
| atualizado_em | DateTime      | Atualizado a cada mensagem   |

### `mensagens`
| Coluna    | Tipo        | Descrição                          |
|-----------|-------------|------------------------------------|
| id        | Integer PK  |                                    |
| chat_id   | FK chats    | Cascade delete                     |
| role      | String(20)  | `"user"` ou `"assistant"`          |
| conteudo  | Text        |                                    |
| criado_em | DateTime    |                                    |

### `tokens_recuperacao`
| Coluna     | Tipo        | Descrição                        |
|-----------|-------------|----------------------------------|
| id         | Integer PK  |                                  |
| usuario_id | FK usuarios |                                  |
| token      | String(255) | Único, gerado com secrets.token_urlsafe(32) |
| usado      | Boolean     | Default: False                   |
| expira_em  | DateTime    | Gerado com +1 hora               |
| criado_em  | DateTime    |                                  |

### IBM DB2 — `BEEIA.Cursos_Totais_IA` (read-only, dados de evasão)
| Coluna                   | Descrição                                      |
|--------------------------|------------------------------------------------|
| NOME_CURSO               | Nome do curso                                  |
| SIGLA_CENTRO             | Centro (CAL, CCNE, CCR, CCS, CCSH, CE, CEFD, CS, CT, CTISM, FW, PM, POLI) |
| ANO                      | 2021, 2022, 2023 ou 2024                       |
| SEMESTRE                 | 1 ou 2                                         |
| TOTAL_CURSOS             | Total de cursos da UFSM                        |
| TOTAL_MATRICULADOS       | Alunos matriculados                            |
| TOTAL_EGRESSOS           | Total de egressos                              |
| TOTAL_METODOS            | Algoritmos de ML utilizados                    |
| TOTAL_ATRIBUTOS          | Variáveis utilizadas na análise                |
| TOTAL_EVASOES            | Total de abandonos                             |
| TOTAL_ACERTOS            | Evasões previstas corretamente                 |
| TOTAL_CALOUROS           | Alunos calouros                                |
| PERCENTUAL_ACERTOS_EVASAO   | % de acerto da evasão                      |
| PERCENTUAL_ACERTOS_ANALISE  | % de acerto da análise                     |

---

## 5. Rotas da API

### Auth (sem prefixo `/api`)
| Método | Path                    | Descrição                                                  |
|--------|-------------------------|------------------------------------------------------------|
| POST   | `/auth/register`        | Cria usuário. Body: `{nome, email, senha}`                 |
| POST   | `/auth/login`           | Login OAuth2 form. Body: `username=email&password=senha`. Retorna JWT + nome + email |
| GET    | `/auth/me`              | Retorna dados do usuário logado (requer Bearer token)      |
| POST   | `/auth/esqueci-senha`   | Query param: `?email=`. Gera token e envia email           |
| POST   | `/auth/resetar-senha`   | Body: `{token, nova_senha}`. Redefine senha                |

### Chat (`/api`)
| Método | Path               | Descrição                                         |
|--------|--------------------|---------------------------------------------------|
| POST   | `/api/chat`        | Cria novo chat. Body: `{titulo?}`                 |
| GET    | `/api/chats`       | Lista chats do usuário ordenados por `atualizado_em` desc |
| GET    | `/api/chat/{id}`   | Retorna chat com todas as mensagens               |
| DELETE | `/api/chat/{id}`   | Deleta chat (cascade deleta mensagens)            |
| PATCH  | `/api/chat/{id}`   | Atualiza título. Body: `{titulo}`                 |

### Pergunta (`/api`)
| Método | Path             | Descrição                                                        |
|--------|------------------|------------------------------------------------------------------|
| POST   | `/api/pergunta`  | Processa pergunta. Body: `{pergunta, chat_id}`. Retorna `{pergunta, resposta, sql}` |

### Utilitários (`/api`)
| Método | Path                   | Descrição                                               |
|--------|------------------------|---------------------------------------------------------|
| GET    | `/api/autocomplete`    | Query param: `?term=`. Retorna até 10 cursos sugeridos |

---

## 6. Fluxo de uma Pergunta até a Resposta

```
1. Usuário digita pergunta no frontend (/chat)
2. Frontend chama POST /api/pergunta {pergunta, chat_id} com Bearer token
3. Backend valida JWT → obtém usuário logado
4. Busca historico de mensagens do chat_id no PostgreSQL
5. services/llm.gerar_sql():
   a. interpretar_pergunta() → GPT-4 identifica curso exato (da lista CURSOS), ano, semestre, centro
      e reformula a pergunta com o nome exato do curso
   b. Monta prompt com schema da tabela BEEIA.Cursos_Totais_IA + histórico de conversa
   c. GPT-4 gera uma única query SQL DB2
6. Valida que o SQL começa com SELECT
7. Executa a query no IBM DB2 via SQLAlchemy (engine do services/database.py)
8. Se >30 resultados, trunca para 30 e adiciona aviso
9. services/llm.formatar_resposta() → GPT-4 (ou GPT-3.5-turbo-16k se dados grandes)
   formata os dados em português, sempre incluindo ANO e SEMESTRE em cada item
10. Salva mensagem user + mensagem assistant no PostgreSQL (tabela mensagens)
11. Atualiza chat.atualizado_em
12. Retorna {pergunta, resposta, sql} ao frontend
13. Frontend exibe resposta e atualiza título do chat (primeiras 5 palavras) se for 1ª mensagem
```

---

## 7. Padrões Visuais do Frontend

### Cores (definidas em `globals.css` como custom properties Tailwind)
| Token CSS       | Valor oklch               | Uso                             |
|----------------|---------------------------|----------------------------------|
| `--color-navy`  | `oklch(0.28 0.09 245)`   | Cor primária: sidebar, header, textos, botões user |
| `--color-orange`| `oklch(0.65 0.18 45)`    | Cor de destaque: botões primários, ícone bot, links, ring de foco |
| background (light) | `oklch(0.87 0.04 245)` | Azul claro (não branco neutro) |
| background (dark)  | `oklch(0.14 0.04 250)` | Azul escuro profundo |

Usados diretamente no código como `bg-navy`, `text-orange`, `bg-orange/10`, `text-navy/60`, etc.

### Componentes Shadcn instalados (`components/ui/`)
- `avatar.tsx`
- `button.tsx`
- `card.tsx`
- `dialog.tsx`
- `input.tsx`
- `label.tsx`
- `scroll-area.tsx`
- `separator.tsx`
- `sheet.tsx` (sidebar mobile)
- `tooltip.tsx`

Estilo Shadcn: `radix-nova`. Ícones: `lucide-react`. Fonte: Geist Sans + Geist Mono (Google Fonts).

### Dark Mode
- Implementado via classe CSS `.dark` no `<html>`
- Preferência persistida em `localStorage('theme')`
- Script inline no `<head>` evita flash no carregamento (`suppressHydrationWarning`)
- Gerenciado pelo `ThemeProvider` em `app/providers.tsx`

### Layout do Chat
- Sidebar fixa 256px (desktop) / Sheet lateral (mobile com breakpoint `md`)
- Mensagens user: alinhadas à direita, fundo `bg-navy` (light) / `bg-orange` (dark)
- Mensagens assistant: alinhadas à esquerda, fundo branco/card com borda sutil
- Loading: 3 pontos animados com `animate-bounce` e delays escalonados

---

## 8. Variáveis de Ambiente

### `backend/.env`
```
# OpenAI
OPENAI_API_KEY=

# IBM DB2 (dados de evasão — read-only)
DB_USER=
DB_PASS=
DB_HOST=
DB_PORT=
DB_NAME=

# PostgreSQL (usuários, chats)
DATABASE_URL=postgresql://usuario:senha@host:5432/beeai

# JWT
SECRET_KEY=

# Email (Gmail SMTP)
MAIL_EMAIL=
MAIL_SENHA=
```

---

## 9. Comandos para Rodar o Projeto

### Desenvolvimento local (sem Docker)
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 5000

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

Ou use o script conveniente:
```bash
chmod +x start.sh
./start.sh
```

### Com Docker Compose
```bash
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- PostgreSQL: localhost:5432 (banco: `beeai`, user: `beeai_user`)

### Migrations (Alembic)
O projeto tem Alembic instalado. As tabelas são criadas automaticamente via `Base.metadata.create_all()` no `services/database_pg.py` na inicialização.

---

## 10. Regras e Padrões Importantes

### Backend
- **Dois bancos separados**: `services/database.py` = IBM DB2 (só leitura, dados de evasão); `services/database_pg.py` = PostgreSQL (escrita, usuários e chats).
- **Autenticação**: `get_usuario_logado` é a dependência FastAPI reutilizável em todas as rotas protegidas. Token JWT expira em 8 horas.
- **Geração de SQL**: feita em duas etapas — primeiro `interpretar_pergunta()` identifica entidades (curso, ano, semestre, centro), depois `gerar_sql()` usa o resultado para montar o prompt com o nome exato do curso. Isso evita que LIKE traga cursos errados.
- **Filtro de curso**: quando o curso é identificado com precisão, usa `LOWER(NOME_CURSO) = LOWER('...')` (igualdade exata). Só usa `LIKE '%termo%'` quando o curso não foi identificado.
- **IBM DB2 não suporta LIMIT**: o prompt instrui o LLM a usar `FETCH FIRST X ROWS ONLY`.
- **Validação SQL**: só executa queries que começam com `SELECT` (proteção básica contra injeção).
- **Resultados truncados**: se mais de 30 linhas, envia só as primeiras 30 ao LLM para formatação.
- **Modelo LLM adaptativo**: usa `gpt-4` por padrão; troca para `gpt-3.5-turbo-16k` se os dados passam de 2000 caracteres.
- **CORS**: `allow_origins=["*"]` — aberto para desenvolvimento.
- **clidriver/**: diretório com binários do IBM DB2 CLI driver. O PATH é modificado em runtime (`os.environ['PATH'] += ... + 'clidriver/bin'`).

### Frontend
- **Autenticação via cookies**: token JWT, nome e email armazenados como cookies de 1 dia via `js-cookie`. Não usa localStorage para o token.
- **Centralização de API**: todas as chamadas HTTP estão em `lib/api.ts`. Nenhuma página faz `fetch` diretamente, exceto `esqueci-senha/page.tsx` e `resetar-senha/page.tsx` (que chamam diretamente o endpoint de auth sem token).
- **Título automático do chat**: na primeira mensagem de um chat, o título é atualizado com as primeiras 5 palavras da pergunta via `PATCH /api/chat/{id}`.
- **Rota raiz (`/`)**: redireciona automaticamente para `/chat` se há cookie de token, senão para `/login`.
- **Sidebar mobile**: implementada com `Sheet` do Shadcn, aberta por botão `Menu` visível apenas abaixo de `md`.
- **Confirmação de delete**: uses `Dialog` do Shadcn para confirmar antes de deletar conversa.
- **Classes Tailwind diretas**: o código usa classes utilitárias diretamente sem componentes abstratos intermediários. Não há `cn()` ou variantes customizadas além do padrão Shadcn.
- **`suppressHydrationWarning`**: usado no `<html>` e no script inline de tema para evitar erros de hidratação do React 19 com dark mode.
