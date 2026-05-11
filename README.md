# AcademIA — Assistente de Evasão UFSM

O **AcademIA** é um assistente inteligente projetado para facilitar a consulta de dados de evasão universitária da UFSM. Utilizando processamento de linguagem natural (LLM), o sistema traduz perguntas em português para consultas SQL complexas, permitindo que gestores e coordenadores acessem informações institucionais sem a necessidade de conhecimento técnico em banco de dados.

---

## 🚀 Motivação

O Centro de Processamento de Dados (CPD) da UFSM mantém uma base de dados robusta com informações de evasão (desistência, abandono, trancamento). No entanto, o acesso a esses dados é restrito a quem domina SQL. 

O AcademIA remove essa barreira, permitindo consultas como:
- *"Qual curso teve mais evasões no centro CCNE em 2023?"*
- *"Compare a evasão de Ciência da Computação nos últimos dois anos"*
- *"Qual o percentual de acerto do modelo para o curso de Medicina?"*

---

## 🏗️ Arquitetura do Sistema

O projeto utiliza uma arquitetura moderna baseada em microserviços e uma pipeline de LLM em três etapas.

### Fluxo de Dados
```mermaid
graph TD
    A[Usuário/Browser] -->|Pergunta| B[Frontend - Next.js 16]
    B -->|POST /api/pergunta| C[Backend - FastAPI]
    
    subgraph "Backend - Orquestração LLM (GPT-4)"
        C --> D[1. Interpretação & Filtros]
        D --> E[2. Geração de SQL]
        E --> F[3. Formatação de Resposta]
    end
    
    E -->|Query SQL| G[(IBM DB2 - Dados UFSM)]
    G -->|Dados Brutos| F
    
    C <--> H[(PostgreSQL - App Data)]
    H --- I(Usuários, Chats, Histórico)
```

### Pipeline de Inteligência (Sem Fine-Tuning)
1.  **Interpretação:** O GPT-4 extrai filtros (ano, semestre, curso) e normaliza nomes de cursos usando uma lista oficial de ~100 cursos.
2.  **Geração de SQL:** Com base nos filtros e no schema da tabela `BEEIA.Cursos_Totais_IA`, gera a query específica para o dialeto IBM DB2, mantendo o contexto do histórico da conversa.
3.  **Formatação:** O resultado bruto do banco é transformado em uma resposta humanizada e clara em português.

---

## ✨ Funcionalidades Principais

- **💬 Conversa Contextual:** O sistema mantém o histórico de cada chat, permitindo perguntas de acompanhamento ("e no ano anterior?").
- **🔍 Autocomplete Inteligente:** Sugestão de cursos em tempo real na barra de busca.
- **🏷️ Titulação Automática:** O sistema gera títulos para os chats baseados na primeira pergunta do usuário.
- **🔐 Autenticação Completa:** Sistema de login, registro, JWT e recuperação de senha via e-mail.
- **🌗 Dark Mode Nativo:** Interface moderna com suporte a temas, persistida no navegador.
- **📱 Responsividade:** UI otimizada para desktop e mobile com sidebar colapsável.

---

## 🛠️ Tecnologias

### Frontend
- **Framework:** [Next.js 16.2.4](https://nextjs.org/) (App Router)
- **Biblioteca UI:** [React 19](https://react.dev/) + [Shadcn/ui](https://ui.shadcn.com/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Ícones:** Lucide React
- **Gerenciamento de Estado:** React Hooks + Cookies (js-cookie)

### Backend
- **Linguagem:** Python 3.12
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **ORM:** SQLAlchemy 2.0
- **IA/LLM:** OpenAI GPT-4 via [LangChain](https://www.langchain.com/)
- **Segurança:** JWT (python-jose), Bcrypt (passlib)

### Bancos de Dados
- **Aplicação:** PostgreSQL 16 (Usuários, Chats, Mensagens)
- **Institucional:** IBM DB2 (Tabela de Evasão via `ibm_db_sa`)

---

## 📂 Estrutura do Projeto

```text
CpdSqlChat/
├── backend/            # API FastAPI e Lógica de LLM
│   ├── routes/         # Endpoints (Auth, Chat, Pergunta, Autocomplete)
│   ├── services/       # Motores de DB, LLM e Email
│   ├── clidriver/      # Driver binário para conexão IBM DB2
│   └── models.py       # Definições das tabelas do PostgreSQL
├── frontend/           # Interface Next.js 16
│   ├── app/            # Páginas e Rotas (Chat, Auth)
│   ├── components/ui/  # Componentes reutilizáveis Shadcn
│   ├── lib/            # Cliente de API e utilitários
│   └── globals.css     # Configurações de tema e Tailwind v4
└── docker-compose.yml  # Orquestração de containers (DBs + App)
```

---

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Docker & Docker Compose
- Chave de API da OpenAI
- Acesso à rede/VPN da UFSM (para o IBM DB2)

### 1. Variáveis de Ambiente
Crie um arquivo `backend/.env` seguindo o modelo:

```env
# IA
OPENAI_API_KEY=sk-...

# IBM DB2 (UFSM)
DB_HOST=...
DB_PORT=50000
DB_NAME=BEE
DB_USER=...
DB_PASS=...

# PostgreSQL (App)
DATABASE_URL=postgresql://beeai_user:suasenha123@localhost:5432/beeai

# JWT & Email
SECRET_KEY=sua_chave_secreta_aqui
MAIL_EMAIL=seu-email@gmail.com
MAIL_SENHA=sua-app-password
```

### 2. Executando com Docker (Recomendado)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

### 3. Execução Local (Manual)
Caso prefira não usar Docker para a aplicação:
1. Suba o banco local: `docker-compose up postgres -d`
2. Backend:
   ```bash
   cd backend && python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 5000
   ```
3. Frontend:
   ```bash
   cd frontend && npm install && npm run dev
   ```
Ou utilize o script auxiliar: `./start.sh`

---

## 📝 Notas de Desenvolvimento

Para desenvolvedores, consulte os arquivos de diretrizes específicas:
- `backend/CLAUDE.md`: Padrões de rotas, lógica do LLM e regras de banco.
- `frontend/CLAUDE.md`: Padrões de componentes, tokens de cor e autenticação.

---

## 📄 Licença

Este projeto é de uso institucional da **Universidade Federal de Santa Maria (UFSM)**.
