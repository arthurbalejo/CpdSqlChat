#!/bin/bash

# Corrige permissões do .next
sudo chown -R $USER:$USER ~/Documentos/CpdSqlChat/frontend/.next 2>/dev/null

# Sobe o PostgreSQL via Docker
cd ~/Documentos/CpdSqlChat
sudo docker compose up postgres -d

# Aguarda o postgres estar pronto
sleep 2

# Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 5000 &

# Frontend
cd ../frontend
npm run dev &

wait
