import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
from constants import CURSOS

load_dotenv()

llm = ChatOpenAI(
    temperature=0,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    max_tokens=2000,
    model="gpt-4"
)

def interpretar_pergunta(pergunta: str) -> dict:
    prompt = f"""
Você recebeu essa pergunta sobre dados universitários da UFSM: "{pergunta}"

Lista completa de cursos válidos:
{chr(10).join(CURSOS)}

Sua tarefa:
1. Identifique o curso mencionado e encontre o nome EXATO mais próximo da lista acima
2. Identifique o ano (2021, 2022, 2023 ou 2024) se mencionado
3. Identifique o semestre (1 ou 2) se mencionado
4. Identifique o centro (CAL, CCNE, CCR, CCS, CCSH, CE, CEFD, CS, CT, CTISM, FW, PM, POLI) se mencionado
5. Reescreva a pergunta de forma clara usando o nome exato do curso

Retorne APENAS um JSON válido sem explicações, sem markdown, sem blocos de código:
{{
  "curso": "nome exato do curso da lista ou null",
  "ano": 2023,
  "semestre": null,
  "centro": null,
  "pergunta_reformulada": "pergunta reescrita com o nome exato do curso"
}}
"""
    resultado = call_llm(prompt)
    try:
        return json.loads(resultado)
    except json.JSONDecodeError:
        # Se o GPT retornar algo inválido, devolve a pergunta original
        return {
            "curso": None,
            "ano": None,
            "semestre": None,
            "centro": None,
            "pergunta_reformulada": pergunta
        }


def gerar_sql(pergunta: str) -> str:
    # Primeiro interpreta a pergunta
    interpretacao = interpretar_pergunta(pergunta)
    pergunta_reformulada = interpretacao.get("pergunta_reformulada", pergunta)
    curso = interpretacao.get("curso")

    print(f"Interpretação: {interpretacao}")  # debug no terminal

    prompt = f"""
Você é um assistente de banco de dados. Com base na pergunta do usuário, gere apenas **uma única consulta SQL** correta e sem erros.

Tabela: BEEIA.Cursos_Totais_IA
Colunas:
- NOME_CURSO: nome do curso
- SIGLA_CENTRO: sigla da unidade de ensino (CAL,CCNE,CCR,CCS,CCSH,CE,CEFD,CS,CT,CTISM,FW,PM,POLI)
- ANO: ano da análise (2021,2022,2023,2024)
- SEMESTRE: semestre do ano, valor 1 ou 2
- TOTAL_CURSOS: número total de cursos da UFSM
- TOTAL_MATRICULADOS: alunos matriculados no curso
- TOTAL_EGRESSOS: total de egressos (formados ou abandonos)
- TOTAL_METODOS: total de algoritmos de ML utilizados
- TOTAL_ATRIBUTOS: total de variáveis utilizadas na análise
- TOTAL_EVASOES: total de abandonos
- TOTAL_ACERTOS: total de evasões previstas corretamente
- TOTAL_CALOUROS: total de alunos calouros
- PERCENTUAL_ACERTOS_EVASAO: percentual de acerto da evasão
- PERCENTUAL_ACERTOS_ANALISE: percentual de acertos da análise

Regras:
- Retorne APENAS o SQL, sem explicações, sem markdown, sem blocos de código
- Sempre inclua as colunas ANO e SEMESTRE no SELECT para que a resposta seja completa
- Sempre use LIKE com % dos dois lados: LOWER(NOME_CURSO) LIKE '%termo%'
- Para perguntas sobre maior/menor valor, use subconsulta no lugar de ORDER BY + LIMIT, exemplo:
  SELECT NOME_CURSO, TOTAL_EVASOES FROM BEEIA.Cursos_Totais_IA 
  WHERE SIGLA_CENTRO = '<CENTRO_DA_PERGUNTA>' 
  AND TOTAL_EVASOES = (SELECT MAX(TOTAL_EVASOES) FROM BEEIA.Cursos_Totais_IA WHERE SIGLA_CENTRO = '<CENTRO_DA_PERGUNTA>')
- Substitua <CENTRO_DA_PERGUNTA> pelo centro mencionado pelo usuário
- Se não houver centro na pergunta, remova o filtro de SIGLA_CENTRO
- Use AVG para médias, MAX/MIN para maior/menor
- Nunca retorne múltiplas queries
- PERIODO é sinônimo de SEMESTRE
- Se o SELECT tiver mais de uma coluna sem agregação, inclua todas no GROUP BY
{f"- O curso identificado na pergunta é: '{curso}', use ele no LIKE" if curso else ""}

Pergunta original: "{pergunta}"
Pergunta reformulada: "{pergunta_reformulada}"
"""
    return call_llm(prompt)


def formatar_resposta(pergunta: str, sql: str, dados: str) -> str:
    prompt = f"""
Você é um assistente que responde perguntas sobre evasão universitária na UFSM.

Contexto:
- A pergunta do usuário foi: "{pergunta}"
- Os dados retornados foram: 
{dados}

Regras:
- Responda de forma clara e objetiva em português
- SEMPRE mencione o ano e semestre de cada registro na resposta
- Formato para cada item: "No X semestre de ANO, houve Y evasões"
- Inclua TODOS os dados retornados na resposta
- Se houver mais de 10 registros, use tópicos numerados
- Não mencione SQL na resposta
- Se não houver dados, diga que não foram encontrados resultados
"""
    return call_llm(prompt)


def call_llm(prompt: str) -> str:
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content.strip()
    except Exception as e:
        print(f"Erro ao chamar LLM: {e}")
        return ""