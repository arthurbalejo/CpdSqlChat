# CpdSqlChat — BEE IA

Sistema de perguntas e respostas em linguagem natural sobre dados de evasão da UFSM, sem necessidade de treinamento de modelo.

---

## Motivação

O CPD da UFSM mantém uma base de dados com informações de evasão (desistência, abandono, trancamento) por curso, semestre e centro. Consultar esses dados exige conhecimento de SQL e acesso direto ao banco — barreiras que limitam o uso por gestores, coordenadores e pesquisadores.

A proposta do projeto é permitir que qualquer pessoa faça perguntas em português natural — como _"Qual curso teve mais evasões em 2023?"_ ou _"Quantos alunos de Ciência da Computação evadiram no primeiro semestre de 2022?"_ — e receba respostas claras, sem precisar escrever SQL nem treinar um modelo específico para o domínio.

A solução usa um LLM de propósito geral (GPT-4) com prompts estruturados para:

1. Interpretar a pergunta e extrair filtros relevantes (curso, ano, semestre, centro)
2. Gerar dinamicamente a query SQL adequada
3. Formatar o resultado bruto do banco em linguagem natural

---

## Arquitetura

```
Usuário
  │  pergunta em português
  ▼
Frontend (Next.js)
  │  POST /api/pergunta
  ▼
Backend (FastAPI)
  │
  ├─► LLM: interpreta a pergunta → extrai filtros
  ├─► LLM: gera SQL com base nos filtros
  ├─► IBM DB2: executa a query
  └─► LLM: formata o resultado → resposta em português
  │
  ▼
Frontend exibe a resposta
```

---

## Estrutura do Projeto

```
CpdSqlChat/
├── backend/
│   ├── main.py                # Entrypoint FastAPI
│   ├── constants.py           # Lista dos 43 cursos da UFSM
│   ├── requirements.txt       # Dependências Python
│   ├── services/
│   │   ├── database.py        # Conexão IBM DB2 via SQLAlchemy
│   │   └── llm.py             # Integração com GPT-4 (3 etapas)
│   └── routes/
│       ├── pergunta.py        # POST /api/pergunta
│       └── autocomplete.py    # GET /api/autocomplete
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Interface de chat (componente principal)
│   │   ├── layout.tsx         # Layout raiz
│   │   ├── providers.tsx      # Provedor de tema (light/dark)
│   │   └── globals.css        # Tailwind + paleta de cores
│   └── components/ui/         # Componentes shadcn (Button, Card, Input…)
│
└── start.sh                   # Script para subir front e back juntos
```

---

## Tecnologias

| Camada     | Tecnologia                              |
|------------|-----------------------------------------|
| Frontend   | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend    | Python 3.12, FastAPI, Uvicorn           |
| LLM        | OpenAI GPT-4 via API                    |
| Banco      | IBM DB2 via SQLAlchemy (`ibm_db_sa`)    |

---

## Pré-requisitos

- Python 3.12+
- Node.js 18+
- Acesso ao banco IBM DB2 da UFSM (rede interna ou VPN)
- Chave de API da OpenAI

---

## Configuração

### Backend

Crie o arquivo `backend/.env` com as seguintes variáveis:

```env
OPENAI_API_KEY=sk-...

DB_HOST=<host do DB2>
DB_PORT=50000
DB_NAME=BEE
DB_USER=<usuario>
DB_PASS=<senha>
```

Instale as dependências (de preferência em um ambiente virtual):

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Linux/macOS
# ou: venv\Scripts\activate   # Windows

pip install -r requirements.txt
```

> O IBM DB2 CLI driver está incluído na pasta `backend/clidriver/`. O pacote `ibm_db` usa esse driver automaticamente ao instalar via pip.

### Frontend

```bash
cd frontend
npm install
```

---

## Executando

### Tudo de uma vez

```bash
./start.sh
```

Esse script sobe o backend e o frontend em paralelo.

### Backend separado

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 5000
```

API disponível em `http://127.0.0.1:5000`

### Frontend separado

```bash
cd frontend
npm run dev
```

Interface disponível em `http://localhost:3000`

---

## Endpoints da API

### `POST /api/pergunta`

Recebe uma pergunta em português e retorna a resposta gerada.

**Request:**
```json
{ "pergunta": "Qual curso teve mais evasões em 2023?" }
```

**Response:**
```json
{
  "pergunta": "Qual curso teve mais evasões em 2023?",
  "resposta": "O curso com maior número de evasões em 2023 foi...",
  "sql": "SELECT ... FROM BEEIA.Cursos_Totais_IA WHERE ..."
}
```

---

### `GET /api/autocomplete?term=comp`

Retorna cursos que correspondem ao termo buscado, para sugestões na interface.

**Response:**
```json
["Ciência da Computação", "Computação - Licenciatura"]
```

---

## Banco de Dados

O sistema consulta a tabela `BEEIA.Cursos_Totais_IA` no IBM DB2 da UFSM. As principais colunas são:

| Coluna                      | Descrição                                  |
|-----------------------------|--------------------------------------------|
| NOME_CURSO                  | Nome completo do curso                     |
| SIGLA_CENTRO                | Centro acadêmico (CAL, CCNE, CCR, etc.)    |
| ANO                         | Ano letivo (2021–2024)                     |
| SEMESTRE                    | Semestre (1 ou 2)                          |
| TOTAL_MATRICULADOS          | Total de alunos matriculados               |
| TOTAL_EVASOES               | Total de evasões                           |
| TOTAL_CALOUROS              | Total de ingressantes                      |
| TOTAL_EGRESSOS              | Total de formandos                         |
| PERCENTUAL_ACERTOS_EVASAO   | Taxa de acerto do modelo preditivo         |

O LLM não tem acesso fixo a queries — ele gera o SQL dinamicamente a cada pergunta com base no schema fornecido via prompt.

---

## Como o LLM é usado (sem treinamento)

O modelo GPT-4 é acionado em três etapas encadeadas, todas via prompts:

1. **Interpretação** — extrai da pergunta os filtros relevantes (curso, ano, semestre, centro)
2. **Geração de SQL** — com base nos filtros e no schema da tabela, gera a query SQL
3. **Formatação** — recebe o resultado bruto do banco e transforma em texto legível em português

Nenhuma etapa exige fine-tuning. O conhecimento do domínio é transmitido inteiramente via prompt (few-shot e descrição do schema).
