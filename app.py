from flask import Flask, request, render_template, jsonify
from sqlalchemy.sql import text
from sqlalchemy import create_engine
import os
from langchain_openai import OpenAI
from config import OPENAI_API_KEY
from config import DB_CONFIG

# Configuração do Flask
app = Flask(__name__)

# Adiciona o caminho da DLL necessária no Windows
# endereço arthur - 'C:\\Users\\arthu\\Documents\\clidriver\\bin'
# endereço ricardo - 
os.add_dll_directory('C:\\Users\\arthu\\Documents\\clidriver\\bin')

# Configurações do OpenAI
llm = OpenAI(temperature=0, verbose=True, openai_api_key=OPENAI_API_KEY, max_tokens=2000)

# Configurações de conexão DB2 via SQLAlchemy
dsn = f"ibm_db_sa://{DB_CONFIG['uid']}:{DB_CONFIG['pwd']}@{DB_CONFIG['hostname']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
engine = create_engine(dsn)


def generate_sql_query(user_question):
    prompt = f"""
Você é um assistente de banco de dados. Com base na pergunta do usuário, gere apenas **uma única consulta SQL** correta e sem erros.
Tabela: BEEIA.Cursos_Totais_IA
Colunas: 
NOME_CURSO: nome do curso (Administracao Diurno CCSH,Administracao Diurno PM,Administracao Noturno CCSH,Administracao Noturno PM,Agronomia CCR,Agronomia FW,Arquitetura e Urbanismo CS,Arquitetura e Urbanismo CT,Arquivologia,Artes Visuais Bacharelado,Artes Visuais Licenciatura,Ciencia da Computacao,Ciencias Biologicas,Ciencias Biologicas PM,Ciencias Contabeis Diurno,Ciencias Contabeis Noturno,
Ciencias Economicas Diurno,Ciencias Economicas Noturno,Ciencias Economicas PM,Ciencias Sociais Licenciatura,Ciencias SociaisBacharelado,Danca Licenciatura,Desenho Industrial,Direito Diurno,
Direito Noturno,Educacao Especial Diurno,Educacao Especial Noturno,Educacao Fisica Bacharelado,Educacao Fisica Licenciatura,Enfermagem CCS,Enfermagem PM,Engenharia Acustica,Engenharia Aeroespacial,
Engenharia Agricola CS,Engenharia Ambiental e Sanitaria FW,Engenharia Civil,Engenharia da Computacao,Engenharia de Controle e Automacao,Engenharia de Producao,Engenharia de Telecomunicacoes,
Engenharia de Transportes e Logistica CS,Engenharia Eletrica CS,Engenharia Eletrica CT,Engenharia Florestal CCR,Engenharia Florestal FW,Engenharia Mecanica CS,Engenharia Mecanica CT,
Engenharia Quimica,Engenharia Sanitaria e Ambiental,Estatistica,Filosofia Bacharelado,Filosofia Licenciatura,Fisica Bacharelado,Fisica Licenciatura Diurno,Fisica Licenciatura Noturno,
Fisioterapia,Fonoaudiologia,Geografia Bacharelado,Geografia Licenciatura,Historia Licenciatura,Jornalismo CCSH,Jornalismo FW,Letras Bacharelado,Letras Espanhol,Letras Ingles,Letras Portugues,
Matematica Bacharelado,    Matematica Licenciatura Diurno,Matematica Licenciatura Noturno,Medicina,Medicina Veterinaria,Meteorologia,Musica e Tecnologia Bacharelado,Nutricao PM,Odontologia,Pedagogia Diurno,
Pedagogia Noturno,PEG,Producao Editorial,Psicologia,Publicidade e Propaganda,Quimica Bacharelado,Quimica Industrial,Quimica Licenciatura,Relacoes Internacionais,Relacoes Publicas CCSH,Relacoes Publicas FW,Servico Social,
Sistemas de Informacao CT,Sistemas de Informacao FW,Teatro,Tecnologia de Geoprocessamento,Tecnologia em Agronegocio,Tecnologia em Alimentos,Tecnologia em Eletronica Industrial,Tecnologia em Fabricacao Mecanica,
Tecnologia em Gestao Ambiental,Tecnologia em Gestao de Cooperativas,Tecnologia em Gestao de Turismo,Tecnologia em Processos Quimicos,Tecnologia em Redes de Computadores,Tecnologia em Sistemas para Internet,
Terapia Ocupacional,Zootecnia CCR,Zootecnia PM)
- SIGLA_CENTRO: sigla da unidade de ensino na qual o curso pertence
- ANO: ano em que foi realizada a análise da evasão (2021, 2022, 2023, 2024, 2025, 2026, 2027)
- SEMESTRE: semestre dentro ano. Pode ter o valor 1 ou 2
- TOTAL_CURSOS: número total de cursos da UFSM
- TOTAL_MATRICULADOS: número de alunos matriculados em um curso em um ano e semestre
- TOTAL_EGRESSOS: total de alunos egressos (formados ou abandonos) em um curso em um ano e semestre
- TOTAL_METODOS: total de algoritmos de aprendizagem de máquina utilizados para realizar a análise do curso em um ano e semestre
- TOTAL_ATRIBUTOS: total de variáveis utilizadas para análise de um curso em um ano e semestre
- TOTAL_EVASOES: total de abandonos em um curso em um ano e semestre
- TOTAL_ACERTOS: total de evasões que foram previstas em um curso em um ano e semestre
- TOTAL_CALOUROS: total de alunos calouros em curso em um ano e semestre
- PERCENTUAL_ACERTOS_EVASAO: percentual de acerto da evasão no curso em um ano e semestre
- PERCENTUAL_ACERTOS_ANALISE: percentual de acertos da análise da evasão no curso em um ano e semestre

Regras para geração da consulta:
- Retorne apenas uma consulta SQL que atenda à pergunta do usuário.
- Sempre ignore diferenças entre maiúsculas e minúsculas.
- Se a pergunta for sobre um curso, inclua WHERE LOWER(NOME_CURSO) e LIKE para buscar o nome do curso.
- Se a pergunta for sobre uma média, use funções como AVG.
- Se for sobre o maior ou menor valor, use funções como MAX ou MIN.
- Não inclua múltiplas consultas SQL na mesma resposta.
- Se existir mais de um curso, escrever o SQL utilizando a cláusula GROUP BY pelo nome do curso.

Pergunta do usuário: \"{user_question}\"

"""
    try:
        sql_query = llm.generate([prompt])
        return sql_query.generations[0][0].text.strip()
    except Exception as e:
        print(f"Erro ao gerar consulta SQL: {e}")
        return None


# Rota principal para renderizar a página
@app.route('/')
def index():
    return render_template('index.html')  # Certifique-se de que o arquivo index.html está na pasta templates


# Rota para processar perguntas
@app.route('/api/pergunta', methods=['POST'])
def responder_pergunta():
    data = request.json
    pergunta = data.get("pergunta")
    

    if not pergunta:
        return jsonify({"erro": "Pergunta não fornecida"}), 400

    try:
        # Gerar consulta SQL
        sql_query = generate_sql_query(pergunta)
        if not sql_query:
            return jsonify({"erro": "Erro ao gerar a consulta SQL"}), 500

        print(f"Consulta SQL Gerada: {sql_query}")

        # Executar a consulta no banco de dados
        with engine.connect() as connection:
            result = connection.execute(text(sql_query)).fetchall()

        # Verificar e formatar os resultados
        if result:
            formatted_result = [", ".join(map(str, row)) for row in result]
            resposta = "Resultados encontrados:\n" + "\n".join(formatted_result)
        else:
            resposta = "Nenhum resultado encontrado."

        #sô para ficar copiaddo Mostrar somente o total de calouros de cada curso em 2023

        if resposta:
            #print('************************')
            #print(sql_query)
            #print('************************')
            #print(pergunta)
            #print('************************')
            #print(resposta)
            #print('************************')
            prompt_resposta = f"""
            Voce é um chat assistente que recebe instruções para realizar uma tarefa..
            Instruções:
            1. A consulta SQL ({sql_query}) foi realizada com base na pergunta do usuário ({pergunta}).
            2. A resposta obtida ({resposta}) contém os dados resultantes da query.
            3. Inclua todos os dados da resposta obtida na resposta.
            4. Se houver mais de 10 registros, apresente os dados em formato de tópicos numerados.
            Tarefa:
            - Responda à pergunta do usuário com base na resposta obtida.
            - Forneça uma resposta clara e objetiva.
            """

            try:
                #print(resposta)
                resposta_tratada = llm.generate([prompt_resposta])
                resposta = resposta_tratada.generations[0][0].text.strip()
                print(resposta) 
            except Exception as e:
                print(f"Erro ao gerar respota baseada na consulta SQL: {e}")
        else:
            resposta = "Nenhum resultado encontrado."
            

        return jsonify({"pergunta": pergunta, "resposta": resposta})
        
    except Exception as e:
        print(f"Erro ao processar a pergunta: {e}")
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
    
    
