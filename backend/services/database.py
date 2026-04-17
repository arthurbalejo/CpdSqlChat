import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

os.environ['PATH'] += os.pathsep + 'clidriver/bin'

def get_engine():
    user = os.getenv("DB_USER")
    pwd  = os.getenv("DB_PASS")
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")
    name = os.getenv("DB_NAME")

    dsn = f"ibm_db_sa://{user}:{pwd}@{host}:{port}/{name}"
    return create_engine(dsn)