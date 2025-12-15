from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.core.database import engine, Base
from app.api.endpoints import router as api_router

load_dotenv()

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI For Business Report", version="2.0")

# CORS Configuration - Include production frontend URL
# Set CORS_ORIGINS environment variable on Render to override
cors_origins_env = os.getenv(
    "CORS_ORIGINS", 
    "https://afbr-version-2.vercel.app,http://localhost:3000"
)
origins = [origin.strip() for origin in cors_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "AI For Business Report API",
        "version": "2.0",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "api": "/api"
        }
    }

@app.get("/health")
async def health():
    from datetime import datetime
    return {"status": "ok", "time": datetime.utcnow()}

@app.get("/debug-env")
async def debug_env():
    """Temporary debug endpoint - DELETE AFTER TESTING"""
    import os
    return {
        "has_jwt_secret": bool(os.getenv("SUPABASE_JWT_SECRET")),
        "jwt_secret_length": len(os.getenv("SUPABASE_JWT_SECRET", "")),
        "has_database_url": bool(os.getenv("DATABASE_URL")),
        "has_openai_key": bool(os.getenv("OPENAI_API_KEY"))
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
