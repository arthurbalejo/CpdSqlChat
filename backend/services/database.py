import os
from pathlib import Path
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

# Compute absolute paths relative to this file so the defaults work in both
# local dev (backend/services/database.py → backend/clidriver/) and Docker
# (/app/services/database.py → /app/clidriver/).
_base = Path(__file__).parent.parent
clidriver_path = os.getenv("CLIDRIVER_PATH", str(_base / "clidriver" / "bin"))
clidriver_lib = os.getenv("CLIDRIVER_LIB", str(_base / "clidriver" / "lib"))

os.environ['PATH'] += os.pathsep + clidriver_path
os.environ['LD_LIBRARY_PATH'] = clidriver_lib

def _create_engine():
    user = os.getenv("DB_USER")
    pwd  = os.getenv("DB_PASS")
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")
    name = os.getenv("DB_NAME")

    dsn = f"ibm_db_sa://{user}:{pwd}@{host}:{port}/{name}"
    return create_engine(dsn)

# Engine criado uma única vez ao importar o módulo
engine = _create_engine()