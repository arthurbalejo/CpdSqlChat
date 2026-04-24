from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.sql import text
from sqlalchemy.exc import ResourceClosedError, ProgrammingError
from services.database import engine
from services.llm import gerar_sql, formatar_resposta

router = APIRouter()

class PerguntaRequest(BaseModel):
    pergunta: str

def is_sql_valido(query: str) -> bool:
    return query.strip().upper().startswith("SELECT")

@router.post("/pergunta")
def responder_pergunta(body: PerguntaRequest):
    pergunta = body.pergunta

    sql_query = gerar_sql(pergunta)
    print(f"SQL gerado: {sql_query}")

    if not sql_query or not is_sql_valido(sql_query):
        return {
            "pergunta": pergunta,
            "resposta": "Não consegui entender sua pergunta. Tente perguntar sobre evasão, percentuais, cursos ou anos específicos.",
            "sql": None
        }

    try:
        with engine.connect() as conn:
            rows = conn.execute(text(sql_query)).fetchall()
    except ResourceClosedError:
        return {
            "pergunta": pergunta,
            "resposta": "A consulta não retornou dados. Tente reformular a pergunta.",
            "sql": sql_query
        }
    except ProgrammingError as e:
        print(f"Erro SQL: {e}")
        return {
            "pergunta": pergunta,
            "resposta": "Houve um erro ao consultar o banco. Tente reformular a pergunta.",
            "sql": sql_query
        }

    if not rows:
        return {"pergunta": pergunta, "resposta": "Nenhum resultado encontrado.", "sql": sql_query}

    # Formatar dados brutos
    formatted = [", ".join(map(str, r)) for r in rows]

    # Limita a 30 linhas para não estourar o contexto do GPT
    if len(formatted) > 30:
        dados_brutos = "Resultados (primeiros 30 de {}):\n".format(len(formatted))
        dados_brutos += "\n".join(formatted[:30])
        dados_brutos += f"\n... e mais {len(formatted) - 30} registros."
    else:
        dados_brutos = "Resultados:\n" + "\n".join(formatted)

    resposta_final = formatar_resposta(pergunta, sql_query, dados_brutos)
    return {"pergunta": pergunta, "resposta": resposta_final, "sql": sql_query}