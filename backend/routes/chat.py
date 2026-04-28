from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from services.database_pg import get_db
from routes.auth import get_usuario_logado
from models import Usuario, Chat, Mensagem

router = APIRouter()


class CriarChatRequest(BaseModel):
    titulo: Optional[str] = "Novo Chat"


class AtualizarChatRequest(BaseModel):
    titulo: str


@router.post("/chat")
def criar_chat(
    body: CriarChatRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_logado),
):
    chat = Chat(usuario_id=usuario.id, titulo=body.titulo)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return {"id": chat.id, "titulo": chat.titulo, "criado_em": chat.criado_em}


@router.get("/chats")
def listar_chats(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_logado),
):
    chats = (
        db.query(Chat)
        .filter(Chat.usuario_id == usuario.id)
        .order_by(Chat.atualizado_em.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "titulo": c.titulo,
            "criado_em": c.criado_em,
            "atualizado_em": c.atualizado_em,
        }
        for c in chats
    ]


@router.get("/chat/{chat_id}")
def obter_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_logado),
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.usuario_id == usuario.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat não encontrado")
    return {
        "id": chat.id,
        "titulo": chat.titulo,
        "mensagens": [
            {"id": m.id, "role": m.role, "conteudo": m.conteudo, "criado_em": m.criado_em}
            for m in chat.mensagens
        ],
    }


@router.delete("/chat/{chat_id}")
def deletar_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_logado),
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.usuario_id == usuario.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat não encontrado")
    db.delete(chat)
    db.commit()
    return {"mensagem": "Chat deletado com sucesso"}


@router.patch("/chat/{chat_id}")
def atualizar_chat(
    chat_id: int,
    body: AtualizarChatRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_logado),
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.usuario_id == usuario.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat não encontrado")
    chat.titulo = body.titulo
    chat.atualizado_em = datetime.utcnow()
    db.commit()
    db.refresh(chat)
    return {"id": chat.id, "titulo": chat.titulo, "atualizado_em": chat.atualizado_em}
