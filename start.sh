#!/bin/bash

# Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 5000 &

# Frontend
cd ../frontend
npm run dev &

# Aguarda Ctrl+C para encerrar tudo
wait
