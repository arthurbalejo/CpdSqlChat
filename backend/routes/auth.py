from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from services.database_pg import get_db
from services.auth import (
    hash_senha, verificar_senha, criar_token,
    verificar_token, gerar_token_recuperacao
)
from models import Usuario, TokenRecuperacao
from services.email import enviar_email_recuperacao

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# --- Schemas ---
class RegisterRequest(BaseModel):
    nome: str
    email: EmailStr
    senha: str

class ResetSenhaRequest(BaseModel):
    token: str
    nova_senha: str

# --- Dependência reutilizável ---
def get_usuario_logado(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = verificar_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    usuario = db.query(Usuario).filter(Usuario.email == payload.get("sub")).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return usuario

# --- Rotas ---
@router.post("/auth/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    usuario = Usuario(
        nome=body.nome,
        email=body.email,
        senha_hash=hash_senha(body.senha)
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return {"mensagem": "Usuário criado com sucesso"}

@router.post("/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == form.username).first()
    if not usuario or not verificar_senha(form.password, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    token = criar_token({"sub": usuario.email, "nome": usuario.nome})
    return {
        "access_token": token,
        "token_type": "bearer",
        "nome": usuario.nome,
        "email": usuario.email
    }

@router.get("/auth/me")
def me(usuario: Usuario = Depends(get_usuario_logado)):
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email
    }


@router.post("/auth/resetar-senha")
def resetar_senha(body: ResetSenhaRequest, db: Session = Depends(get_db)):
    token_obj = db.query(TokenRecuperacao).filter(
        TokenRecuperacao.token == body.token,
        TokenRecuperacao.usado == False,
        TokenRecuperacao.expira_em > datetime.utcnow()
    ).first()

    if not token_obj:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")

    usuario = db.query(Usuario).filter(Usuario.id == token_obj.usuario_id).first()
    usuario.senha_hash = hash_senha(body.nova_senha)
    token_obj.usado = True
    db.commit()

    return {"mensagem": "Senha alterada com sucesso"}

@router.post("/auth/esqueci-senha")
async def esqueci_senha(email: str, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario:
        return {"mensagem": "Se o email existir, você receberá as instruções"}

    # Invalida tokens anteriores
    db.query(TokenRecuperacao).filter(
        TokenRecuperacao.usuario_id == usuario.id,
        TokenRecuperacao.usado == False
    ).delete()
    db.commit()

    token = gerar_token_recuperacao()
    token_obj = TokenRecuperacao(
        usuario_id=usuario.id,
        token=token,
        expira_em=datetime.utcnow() + timedelta(hours=1)
    )
    db.add(token_obj)
    db.commit()

    try:
        print(f"Tentando enviar email para {email}...")
        await enviar_email_recuperacao(email, token)
        print(f"Email enviado com sucesso para {email}")
    except Exception as e:
        print(f"Erro ao enviar email: {e}")

    return {"mensagem": "Se o email existir, você receberá as instruções"}