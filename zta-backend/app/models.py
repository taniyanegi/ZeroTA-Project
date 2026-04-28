from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="user") # user or admin
    trust_score = Column(Float, default=1.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # MFA fields
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)

    session_logs = relationship("SessionLog", back_populates="user")

class SessionLog(Base):
    __tablename__ = "session_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ip_address = Column(String)
    action = Column(String)
    anomaly_score = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="session_logs")
