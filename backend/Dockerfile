FROM python:3.12-slim

WORKDIR /app

# Dependências do sistema para o ibm_db
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libxml2 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Garante que o clidriver está no PATH
ENV PATH="/app/clidriver/bin:${PATH}"
ENV LD_LIBRARY_PATH="/app/clidriver/lib:${LD_LIBRARY_PATH}"

EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]