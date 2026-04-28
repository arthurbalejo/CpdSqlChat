from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.autocomplete import router as autocomplete_router
from routes.pergunta import router as pergunta_router
from routes.auth import router as auth_router
from routes.chat import router as chat_router

app = FastAPI(title="BEE IA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(autocomplete_router, prefix="/api")
app.include_router(pergunta_router, prefix="/api")
app.include_router(auth_router)
app.include_router(chat_router, prefix="/api")