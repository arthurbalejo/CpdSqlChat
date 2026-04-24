import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from models import Base

load_dotenv()

engine_pg = create_engine(os.getenv("DATABASE_URL"))

SessionLocal = sessionmaker(bind=engine_pg)

# Cria as tabelas automaticamente se não existirem
Base.metadata.create_all(bind=engine_pg)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
