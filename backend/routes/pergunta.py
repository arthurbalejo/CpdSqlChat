from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.sql import text
from services.database import get_engine
from services.llm import gerar_sql, formatar_resposta 

router = APIRouter()

class PerguntaRequest(BaseModel):
    pergunta: str

@router.post("/pergunta")
def responder_pergunta(body: PerguntaRequest):
    pergunta = body.pergunta

    # Gerar SQL
    sql_query = gerar_sql(pergunta) 
    if not sql_query:
        raise HTTPException(status_code=500, detail="Erro ao gerar SQL")

    # Executar no banco
    engine = get_engine()
    with engine.connect() as conn:
        rows = conn.execute(text(sql_query)).fetchall()

    if not rows:
        return {"pergunta": pergunta, "resposta": "Nenhum resultado encontrado."}

    # Formatar dados brutos
    formatted = [", ".join(map(str, r)) for r in rows]
    dados_brutos = "Resultados:\n" + "\n".join(formatted)

    # Formatar resposta
    resposta_final = formatar_resposta(pergunta, sql_query, dados_brutos)  # ← usa a função do llm.py
    return {"pergunta": pergunta, "resposta": resposta_final, "sql": sql_query}