# Deploy em Producao

## Arquitetura

```
Browser
  |
  v
nginx :80          (roteador publico)
  |-- /api/*  -->  FastAPI :5000   (backend)
  |-- /auth/* -->  FastAPI :5000   (backend)
  \-- /*      -->  Next.js :3000   (frontend)
```

Tudo sobe via `docker compose`. O `.env` na raiz e o unico arquivo que muda entre dev e producao.

---

## Dev local

```bash
# 1. Configure o ambiente
cp .env.example .env
# .env ja vem com localhost — nao precisa alterar

# 2. Suba os containers
docker compose up --build -d

# 3. Acesse
http://localhost
```

---

## Producao (servidor UFSM)

### 1. Copiar os arquivos para o servidor

```bash
# Via git (recomendado)
git clone <repositorio> CpdSqlChat && cd CpdSqlChat

# Ou via scp
scp -r ./CpdSqlChat usuario@IP-SERVIDOR:~/CpdSqlChat
```

### 2. Criar o root `.env`

```bash
cp .env.example .env
nano .env
```

Alterar os tres valores:

```env
FRONTEND_URL=http://IP-DO-SERVIDOR
CORS_ORIGINS=http://IP-DO-SERVIDOR
POSTGRES_PASSWORD=<senha-forte>
```

Gerar senha forte:

```bash
openssl rand -base64 32
```

### 3. Copiar o `backend/.env`

```bash
scp ./backend/.env usuario@IP-SERVIDOR:~/CpdSqlChat/backend/.env
```

O `backend/.env` tem as credenciais do DB2, OpenAI, JWT e email — nao precisa mudar para producao pois o servidor da UFSM acessa o DB2 diretamente (sem VPN).

### 4. Subir

```bash
docker compose up --build -d
```

### 5. Verificar

```bash
docker ps
docker logs beeai_nginx   --tail 20
docker logs beeai_backend --tail 20
```

---

## Firewall

Com nginx ativo, somente a porta **80** precisa estar acessivel externamente.

```bash
# Fechar portas internas (opcional, recomendado em producao)
sudo ufw allow 80/tcp
sudo ufw deny  3000/tcp
sudo ufw deny  5000/tcp
```

As portas 3000 e 5000 continuam expostas no docker-compose para debug local — o firewall impede acesso externo.

---

## Variaveis de ambiente

| Arquivo | Onde e lido | O que contem |
|---|---|---|
| `.env` (raiz) | Docker Compose | `FRONTEND_URL`, `CORS_ORIGINS`, `POSTGRES_PASSWORD` |
| `backend/.env` | Container do backend | OpenAI, DB2, JWT, email, DATABASE_URL |

O `DATABASE_URL` no `backend/.env` e ignorado pelo Docker Compose — ele usa `postgresql://beeai_user:POSTGRES_PASSWORD@postgres:5432/beeai` com o hostname interno `postgres`.
