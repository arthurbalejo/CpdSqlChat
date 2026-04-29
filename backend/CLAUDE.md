# CLAUDE.md — Backend (AcademIA)

## Stack
- **FastAPI** + **Uvicorn** (porta 5000)
- **SQLAlchemy 2** com dois engines separados:
  - `services/database_pg.py` → PostgreSQL (usuários, chats, mensagens)
  - `services/database.py` → IBM DB2 (tabela de dados de evasão, read-only)
- **LangChain + OpenAI** (`gpt-4` / `gpt-3.5-turbo-16k`)
- **python-jose** (JWT HS256), **passlib/bcrypt**, **aiosmtplib**

---

## Estrutura de Arquivos

```
backend/
├── main.py              # Registra os 4 routers com prefixos
├── models.py            # Modelos ORM do PostgreSQL
├── constants.py         # Lista CURSOS com ~100 cursos da UFSM
├── requirements.txt
├── .env                 # Não commitado
├── clidriver/           # Binários IBM DB2 CLI (modificam PATH em runtime)
├── routes/
│   ├── auth.py          # /auth/* — sem prefixo /api
│   ├── pergunta.py      # /api/pergunta
│   ├── chat.py          # /api/chat(s)
│   └── autocomplete.py  # /api/autocomplete
└── services/
    ├── llm.py           # Toda a lógica com LLM
    ├── auth.py          # JWT + bcrypt helpers
    ├── database.py      # Engine IBM DB2
    ├── database_pg.py   # Engine PostgreSQL + get_db() + create_all()
    └── email.py         # Envio assíncrono via Gmail SMTP (porta 465 TLS)
```

---

## Variáveis de Ambiente (`.env`)

```
OPENAI_API_KEY=       # Chave OpenAI (GPT-4)
DB_USER=              # IBM DB2 usuário
DB_PASS=              # IBM DB2 senha
DB_HOST=              # IBM DB2 host
DB_PORT=              # IBM DB2 porta
DB_NAME=              # IBM DB2 banco
DATABASE_URL=         # postgresql://user:pass@host:5432/beeai
SECRET_KEY=           # Chave para assinar JWTs
MAIL_EMAIL=           # Gmail remetente
MAIL_SENHA=           # App password do Gmail
```

---

## Rotas

### `/auth/register` POST
Body JSON: `{nome, email, senha}`. Hasheia senha com bcrypt e cria `Usuario`.

### `/auth/login` POST
Formato OAuth2 form-urlencoded: `username=email&password=senha`.
Retorna `{access_token, token_type, nome, email}`. Token expira em 8h.

### `/auth/me` GET
Requer Bearer token. Retorna `{id, nome, email}`.

### `/auth/esqueci-senha` POST
Query param `?email=`. Invalida tokens anteriores não usados, gera novo token (`secrets.token_urlsafe(32)`), salva em `tokens_recuperacao` com expiração de 1h, envia email assíncrono.
**Não revela se o email existe** (resposta sempre a mesma).

### `/auth/resetar-senha` POST
Body JSON: `{token, nova_senha}`. Valida token (não usado + não expirado), troca senha, marca token como usado.

### `/api/pergunta` POST (autenticado)
Body JSON: `{pergunta, chat_id}`.
Fluxo completo: interpreta → gera SQL → executa no DB2 → formata → salva mensagens → retorna `{pergunta, resposta, sql}`.

### `/api/chat` POST (autenticado)
Cria novo chat. Body: `{titulo?}` (default: "Novo Chat").

### `/api/chats` GET (autenticado)
Lista chats do usuário, ordenados por `atualizado_em DESC`.

### `/api/chat/{chat_id}` GET (autenticado)
Retorna chat + lista de mensagens ordenadas por `criado_em`.

### `/api/chat/{chat_id}` DELETE (autenticado)
Deleta chat (cascade deleta mensagens via `cascade="all, delete-orphan"`).

### `/api/chat/{chat_id}` PATCH (autenticado)
Atualiza `titulo` e `atualizado_em`.

### `/api/autocomplete` GET
Query param `?term=`. Filtra lista `CURSOS` de `constants.py`, ignora palavras comuns ("curso", "de", "evasão"), retorna até 10 matches.

---

## Lógica LLM (`services/llm.py`)

### `interpretar_pergunta(pergunta)` → dict
Chama GPT-4 com a lista completa de cursos. Retorna JSON com:
- `curso`: nome exato da lista ou null
- `ano`, `semestre`, `centro`: extraídos da pergunta
- `pergunta_reformulada`: pergunta reescrita com nome exato do curso

### `gerar_sql(pergunta, historico)` → str
1. Chama `interpretar_pergunta()`
2. Se curso identificado: usa igualdade exata `LOWER(NOME_CURSO) = LOWER('...')`
3. Se não identificado: usa `LIKE '%termo%'`
4. Inclui histórico formatado no prompt para suportar referências como "o mesmo curso", "e em 2022?"
5. Instrui o LLM: só SELECT, nunca LIMIT (DB2 usa `FETCH FIRST X ROWS ONLY`), ANO e SEMESTRE sempre no SELECT
6. Para maior/menor: usa subconsulta em vez de ORDER BY + FETCH

### `formatar_resposta(pergunta, sql, dados)` → str
- Usa `gpt-4` se dados ≤ 2000 chars, senão `gpt-3.5-turbo-16k`
- Instrui o LLM a sempre mencionar ANO e SEMESTRE
- Se múltiplos cursos: agrupa por curso em seções separadas

### `call_llm(prompt, model)` → str
Wrapper genérico. Usa `ChatOpenAI` com `temperature=0`. Retorna string vazia em caso de erro.

---

## Padrões e Regras

### Autenticação
- `get_usuario_logado` é a dependência FastAPI usada em todas as rotas protegidas (importada de `routes/auth.py`)
- JWT expira em 8 horas (480 minutos), algoritmo HS256
- Bcrypt via passlib

### Dois Bancos de Dados
- **Nunca misturar**: queries de evasão → `engine` (DB2); queries de usuários/chats → `get_db()` Session (PostgreSQL)
- O `engine` do DB2 é criado uma única vez na importação do módulo (`services/database.py`)
- O PostgreSQL cria tabelas automaticamente via `Base.metadata.create_all()` na inicialização

### Validação de SQL
```python
def is_sql_valido(query: str) -> bool:
    return query.strip().upper().startswith("SELECT")
```
Só executa queries que começam com SELECT.

### Tratamento de Erros SQL
- `ResourceClosedError`: query não retornou dados
- `ProgrammingError`: erro de sintaxe ou schema — logado e mensagem amigável retornada
- Em ambos os casos: mensagem é salva no histórico e retornada ao frontend

### Truncamento de Resultados
Se `len(rows) > 30`: envia só primeiros 30 ao LLM com aviso do total real.

### Modelos ORM
- `Conversa` está definida mas é legada — o fluxo atual usa `Chat` + `Mensagem`
- `Chat.mensagens` é carregado eager por padrão via `order_by="Mensagem.criado_em"` na relação
- `TokenRecuperacao`: tokens anteriores são invalidados (deletados) antes de gerar novo

### Email
- Gmail SMTP porta 465 com TLS
- Link de recuperação aponta para `http://localhost:3000/resetar-senha?token=...`
- Erros de envio são capturados silenciosamente (só log) — a resposta da API não muda

### CORS
`allow_origins=["*"]` — configuração aberta para desenvolvimento. Restringir em produção.

### IBM DB2 CLI Driver
O diretório `backend/clidriver/` contém os binários necessários. O módulo `services/database.py` adiciona `clidriver/bin` ao `PATH` antes de criar o engine:
```python
os.environ['PATH'] += os.pathsep + 'clidriver/bin'
```
