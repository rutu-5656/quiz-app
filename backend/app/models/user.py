from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    name             = Column(String(100), nullable=False)
    email            = Column(String(150), unique=True, nullable=False)
    password_hash    = Column(String(255), nullable=False)
    role             = Column(Enum("student", "admin"), default="student")
    total_points     = Column(Integer, default=0)
    compete_attempts = Column(Integer, default=0)
    created_at       = Column(TIMESTAMP, server_default=func.now())
