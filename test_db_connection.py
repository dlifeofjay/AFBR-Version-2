import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load env vars
load_dotenv()

dataset_url = os.getenv("DATABASE_URL")
print(f"Testing Connection to: {dataset_url}")

try:
    engine = create_engine(dataset_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("\nSUCCESS: Connection Verified!")
        print(f"Result: {result.fetchone()}")
except Exception as e:
    print("\nFAILURE: Connection Failed.")
    print(f"Error: {e}")
