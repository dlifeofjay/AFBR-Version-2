from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Using the existing connection string structure
# "mssql+pyodbc://DESKTOP-1IJSSIA\\JAY/AFBR?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"
# It is better to load this from env, but I will keep the hardcoded one as fallback or default if not in env,
# matching the user's original file to ensure connectivity.

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# fast_executemany is good for bulk inserts
engine = create_engine(DATABASE_URL, fast_executemany=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
