import os
import json
import time
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
from sqlalchemy.sql import text
from constants import CURSOS
from services.database import engine

load_dotenv()

llm = ChatOpenAI(
    temperature=0,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    max_tokens=2000,
    model="gpt-4"
)

_cache_prompts = {"dados": None, "expira": 0}


def carregar_prompts() -> dict:
    global _cache_prompts
    agora = time.time()
    if _cache_prompts["dados"] is not None and agora < _cache_prompts["expira"]:
        return _cache_prompts["dados"]
    try:
        with engine.connect() as conn:
            resultado = conn.execute(
                text(
                    "SELECT PROMPT_TRATAMENTO, PROMPT_PERGUNTA, PROMPT_RESPOSTA "
                    "FROM ACBALEJO.PROMPTS_INTEGRA FETCH FIRST 1 ROWS ONLY"
                )
            )
            linha = resultado.fetchone()
            if linha is None:
                raise ValueError("Tabela ACBALEJO.PROMPTS_INTEGRA esta vazia")
            dados = {
                "PROMPT_TRATAMENTO": linha[0],
                "PROMPT_PERGUNTA":   linha[1],
                "PROMPT_RESPOSTA":   linha[2],
            }
            _cache_prompts["dados"]  = dados
            _cache_prompts["expira"] = agora + 60
            return dados
    except Exception as e:
        raise RuntimeError(
            f"Falha ao carregar prompts de BEEIA.PROMPTS_INTEGRA: {e}"
        ) from e


def interpretar_pergunta(pergunta: str) -> dict:
    prompts = carregar_prompts()
    cursos  = chr(10).join(CURSOS)
    prompt  = prompts["PROMPT_TRATAMENTO"].format(pergunta=pergunta, cursos=cursos)
    resultado = call_llm(prompt)
    try:
        return json.loads(resultado)
    except json.JSONDecodeError:
        # GPT retornou JSON invalido: devolve estrutura padrao com a pergunta original
        return {
            "curso": None,
            "ano": None,
            "semestre": None,
            "centro": None,
            "pergunta_reformulada": pergunta
        }


def gerar_sql(pergunta: str, historico: list = None) -> str:
    interpretacao        = interpretar_pergunta(pergunta)
    pergunta_reformulada = interpretacao.get("pergunta_reformulada", pergunta)
    curso                = interpretacao.get("curso")

    print(f"Interpretacao: {interpretacao}")

    contexto_historico = ""
    if historico:
        linhas = [
            f"[{'Usuário' if m['role'] == 'user' else 'Assistente'}]: {m['conteudo']}"
            for m in historico
        ]
        contexto_historico = (
            "Histórico da conversa (use para interpretar referências como 'o mesmo', 'esse curso', 'e em 2022?'):\n"
            + "\n".join(linhas)
            + "\n\n"
        )

    if curso:
        regra_curso = (
            f"- FILTRO DE CURSO OBRIGATÓRIO: o curso foi identificado com precisão como '{curso}'. "
            f"Use SEMPRE igualdade exata: LOWER(NOME_CURSO) = LOWER('{curso}'). "
            f"NUNCA use LIKE para esse curso — LIKE retornaria cursos com nomes parecidos e misturaria dados."
        )
    else:
        regra_curso = (
            "- FILTRO DE CURSO: o curso não foi identificado com precisão. "
            "Use LIKE com % dos dois lados: LOWER(NOME_CURSO) LIKE '%termo%'"
        )

    prompts = carregar_prompts()
    prompt  = prompts["PROMPT_PERGUNTA"].format(
        historico=contexto_historico,
        regra_curso=regra_curso,
        pergunta=pergunta,
        pergunta_reformulada=pergunta_reformulada,
    )
    return call_llm(prompt)


def formatar_resposta(pergunta: str, sql: str, dados: str) -> str:
    prompts = carregar_prompts()
    prompt  = prompts["PROMPT_RESPOSTA"].format(pergunta=pergunta, dados=dados)
    model   = "gpt-3.5-turbo-16k" if len(dados) > 2000 else "gpt-4"
    return call_llm(prompt, model=model)


def call_llm(prompt: str, model: str = "gpt-4") -> str:
    try:
        client = ChatOpenAI(
            temperature=0,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            max_tokens=2000,
            model=model
        )
        response = client.invoke([HumanMessage(content=prompt)])
        return response.content.strip()
    except Exception as e:
        print(f"Erro ao chamar LLM: {e}")
        return ""
