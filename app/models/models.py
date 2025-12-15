from sqlalchemy import Column, String, DateTime, JSON
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String(32), primary_key=True)
    user_name = Column(String(255))
    industry = Column(String(255))
    email = Column(String(255), unique=True, index=True, nullable=False)
    date_created = Column(DateTime, default=datetime.utcnow)
    

class Report(Base):
    __tablename__ = "reports"
    id = Column(String(32), primary_key=True)
    user_id = Column(String(32), index=True)
    filename = Column(String(70))
    status = Column(String(30), default="preprocessing")
    column_mapping = Column(JSON, nullable=True)
    analysis = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
