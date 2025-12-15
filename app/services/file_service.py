import pandas as pd
import io
from fastapi import UploadFile, HTTPException

MAX_FILE_SIZE = 5 * 1024 * 1024 # 5MB
MAX_ROWS = 10_000

async def parse_file(file: UploadFile) -> pd.DataFrame:
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large (max 5MB)")

    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")
        elif file.filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents), engine="xlrd")
        else:
            raise HTTPException(400, "Unsupported file format. Please upload CSV or Excel.")
    except Exception as e:
        raise HTTPException(400, f"Failed to parse file: {str(e)}")

    if df.empty:
        raise HTTPException(400, "File is empty")
    if len(df) > MAX_ROWS:
        raise HTTPException(400, "Too many rows (max 10,000)")

    return df
