import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(
    temperature=0,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    max_tokens=2000,
    model="gpt-4"
)

def gerar_sql(pergunta: str) -> str:
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
- Use WHERE LOWER(NOME_CURSO) LIKE para buscar cursos
- Use AVG para médias, MAX/MIN para maior/menor
- Nunca retorne múltiplas queries
- Ignore diferenças entre maiúsculas e minúsculas
- PERIODO é sinônimo de SEMESTRE
- Se o SELECT tiver mais de uma coluna sem agregação, inclua todas no GROUP BY

Pergunta: "{pergunta}"
"""
    return call_llm(prompt)


def formatar_resposta(pergunta: str, sql: str, dados: str) -> str:
    prompt = f"""
Você é um assistente que responde perguntas sobre evasão universitária na UFSM.

Contexto:
- A pergunta do usuário foi: "{pergunta}"
- A consulta SQL executada foi: {sql}
- Os dados retornados foram: {dados}

Regras:
- Responda de forma clara e objetiva em português
- Inclua TODOS os dados retornados na resposta
- Se houver mais de 10 registros, use tópicos numerados
- Não mencione SQL na resposta
- Se não houver dados, diga que não foram encontrados resultados
"""
    return call_llm(prompt)


def call_llm(prompt: str) -> str:
    response = llm.invoke([HumanMessage(content=prompt)])
    return response.content.strip()