from fastapi import APIRouter, UploadFile, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
import json

from app.core.database import get_db
from app.models.models import User, Report
from app.schemas.schemas import AnalysisResponse
from app.services import file_service, ai_service

router = APIRouter()

from fastapi.security import OAuth2PasswordBearer
import os
import jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ... imports ...

def verify_jwt(token: str = Depends(oauth2_scheme)):
    try:
        # Supabase JWT Secret should be in .env
        secret = os.getenv("SUPABASE_JWT_SECRET") 
        if not secret:
           # Fail open for development IF explicitly desired, but safer to error
           # For this user context, warning them is better
           raise HTTPException(500, "Server Error: SUPABASE_JWT_SECRET not set")
        
        # Decode and verify token
        payload = jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

def get_or_create_user(
        token_payload: dict = Depends(verify_jwt),
        db: Session = Depends(get_db)
) -> User:
    email = token_payload.get("email")
    if not email:
        raise HTTPException(400, "Token missing email")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Use the Supabase User ID (sub) as the ID, or a stable hash
        # To avoid migration issues with existing data, we stick to the hash logic for now
        # OR better: use the 'sub' (UUID) from Supabase as the canonical ID if possible.
        # But looking at models.py, ID is String(32). UUID is 36 chars.
        # Check models.py again? It says String(32).
        # We'll stick to MD5 of email to perform "Soft Migration" 
        # (aka old users via header still map to same DB row if email matches)
        user = User(
            id=hashlib.md5(email.encode()).hexdigest(),
            email=email,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def check_daily_limit(db: Session, user_id: str) -> bool:
    start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    # Simple check for existing completed reports today
    count = db.query(Report).filter(
        Report.user_id == user_id,
        Report.created_at >= start,
        Report.status == "completed"
    ).count()
    return count >= 1

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_file(
    file: UploadFile,
    user: User = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    if check_daily_limit(db, user.id):
        raise HTTPException(429, "Daily limit reached (1 report per day)")
    
    # 1. Parse File
    df = await file_service.parse_file(file)

    # 2. Create Report Entry
    report_id = hashlib.md5(f"{user.id}{datetime.utcnow()}".encode()).hexdigest()
    report = Report(
        id=report_id,
        user_id=user.id,
        filename=file.filename,
        status="preprocessing",
    )
    db.add(report)
    db.commit()

    try:
        # 3. AI Mapping
        _, mapping = await ai_service.map_columns_ai(df.columns.tolist())
        report.column_mapping = mapping
        
        # 4. AI Analysis
        analysis_result = await ai_service.analyze_data_ai(df, mapping)
        
        report.status = "completed"
        report.analysis = analysis_result
        db.commit()
        
        return AnalysisResponse(
            report_id=report.id,
            status=report.status,
            column_mapping=report.column_mapping,
            analysis=report.analysis,
            created_at=report.created_at,
            filename=report.filename
        )

    except Exception as e:
        report.status = "failed"
        db.commit()
        raise e

@router.get("/report/{report_id}", response_model=AnalysisResponse)
async def get_report(
    report_id: str,
    user: User = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user.id).first()
    if not report:
        raise HTTPException(404, "Report not found")
    
    return AnalysisResponse(
        report_id=report.id,
        status=report.status,
        column_mapping=report.column_mapping,
        analysis=report.analysis,
        created_at=report.created_at,
        filename=report.filename
    )
