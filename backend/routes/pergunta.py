from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from sqlalchemy.exc import ResourceClosedError, ProgrammingError
from datetime import datetime
from services.database import engine
from services.database_pg import get_db
from services.llm import gerar_sql, formatar_resposta
from routes.auth import get_usuario_logado
from models import Usuario, Chat, Mensagem

router = APIRouter()


class PerguntaRequest(BaseModel):
    pergunta: str
    chat_id: int


def is_sql_valido(query: str) -> bool:
    return query.strip().upper().startswith("SELECT")


def _salvar_mensagens(db: Session, chat: Chat, pergunta: str, resposta: str):
    db.add(Mensagem(chat_id=chat.id, role="user", conteudo=pergunta))
    db.add(Mensagem(chat_id=chat.id, role="assistant", conteudo=resposta))
    chat.atualizado_em = datetime.utcnow()
    db.commit()


@router.post("/pergunta")
def responder_pergunta(
    body: PerguntaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_logado),
):
    chat = db.query(Chat).filter(Chat.id == body.chat_id, Chat.usuario_id == usuario.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat não encontrado")

    historico = [{"role": m.role, "conteudo": m.conteudo} for m in chat.mensagens]

    pergunta = body.pergunta
    sql_query = gerar_sql(pergunta, historico=historico)
    print(f"SQL gerado: {sql_query}")

    if not sql_query or not is_sql_valido(sql_query):
        resposta = "Não consegui entender sua pergunta. Tente perguntar sobre evasão, percentuais, cursos ou anos específicos."
        _salvar_mensagens(db, chat, pergunta, resposta)
        return {"pergunta": pergunta, "resposta": resposta, "sql": None}

    try:
        with engine.connect() as conn:
            rows = conn.execute(text(sql_query)).fetchall()
    except ResourceClosedError:
        resposta = "A consulta não retornou dados. Tente reformular a pergunta."
        _salvar_mensagens(db, chat, pergunta, resposta)
        return {"pergunta": pergunta, "resposta": resposta, "sql": sql_query}
    except ProgrammingError as e:
        print(f"Erro SQL: {e}")
        resposta = "Houve um erro ao consultar o banco. Tente reformular a pergunta."
        _salvar_mensagens(db, chat, pergunta, resposta)
        return {"pergunta": pergunta, "resposta": resposta, "sql": sql_query}

    if not rows:
        resposta = "Nenhum resultado encontrado."
        _salvar_mensagens(db, chat, pergunta, resposta)
        return {"pergunta": pergunta, "resposta": resposta, "sql": sql_query}

    formatted = [", ".join(map(str, r)) for r in rows]

    if len(formatted) > 30:
        dados_brutos = "Resultados (primeiros 30 de {}):\n".format(len(formatted))
        dados_brutos += "\n".join(formatted[:30])
        dados_brutos += f"\n... e mais {len(formatted) - 30} registros."
    else:
        dados_brutos = "Resultados:\n" + "\n".join(formatted)

    resposta_final = formatar_resposta(pergunta, sql_query, dados_brutos)
    _salvar_mensagens(db, chat, pergunta, resposta_final)
    return {"pergunta": pergunta, "resposta": resposta_final, "sql": sql_query}
