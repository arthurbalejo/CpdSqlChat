from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import ForeignKey
from datetime import datetime

Base = declarative_base()

class Usuario(Base):
    __tablename__ = "usuarios"

    id              = Column(Integer, primary_key=True, index=True)
    nome            = Column(String(100), nullable=False)
    email           = Column(String(200), unique=True, nullable=False, index=True)
    senha_hash      = Column(String(255), nullable=False)
    ativo           = Column(Boolean, default=True)
    criado_em       = Column(DateTime, default=datetime.utcnow)

    conversas       = relationship("Conversa", back_populates="usuario")
    chats           = relationship("Chat", back_populates="usuario")


class Conversa(Base):
    __tablename__ = "conversas"

    id          = Column(Integer, primary_key=True, index=True)
    usuario_id  = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    pergunta    = Column(Text, nullable=False)
    resposta    = Column(Text, nullable=False)
    sql_gerado  = Column(Text, nullable=True)
    criado_em   = Column(DateTime, default=datetime.utcnow)

    usuario     = relationship("Usuario", back_populates="conversas")


class TokenRecuperacao(Base):
    __tablename__ = "tokens_recuperacao"

    id          = Column(Integer, primary_key=True, index=True)
    usuario_id  = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    token       = Column(String(255), unique=True, nullable=False)
    usado       = Column(Boolean, default=False)
    expira_em   = Column(DateTime, nullable=False)
    criado_em   = Column(DateTime, default=datetime.utcnow)


class Chat(Base):
    __tablename__ = "chats"

    id          = Column(Integer, primary_key=True, index=True)
    usuario_id  = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    titulo      = Column(String(200), nullable=False, default="Novo Chat")
    criado_em   = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow)

    usuario     = relationship("Usuario", back_populates="chats")
    mensagens   = relationship(
        "Mensagem", back_populates="chat",
        cascade="all, delete-orphan",
        order_by="Mensagem.criado_em"
    )


class Mensagem(Base):
    __tablename__ = "mensagens"

    id          = Column(Integer, primary_key=True, index=True)
    chat_id     = Column(Integer, ForeignKey("chats.id"), nullable=False)
    role        = Column(String(20), nullable=False)  # "user" ou "assistant"
    conteudo    = Column(Text, nullable=False)
    criado_em   = Column(DateTime, default=datetime.utcnow)

    chat        = relationship("Chat", back_populates="mensagens")
