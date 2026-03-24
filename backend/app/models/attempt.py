from sqlalchemy import Column, Integer, Float, Boolean, Enum, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id      = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    chapter_id      = Column(Integer, ForeignKey("chapters.id"), nullable=True)
    mode            = Column(Enum("practice", "compete"), nullable=False)
    total_questions = Column(Integer)
    correct_answers = Column(Integer)
    score           = Column(Float)
    compete_points  = Column(Integer, default=0)
    max_streak      = Column(Integer, default=0)
    time_taken      = Column(Integer)
    attempted_at    = Column(TIMESTAMP, server_default=func.now())
    details         = relationship("AttemptDetail", back_populates="attempt")


class AttemptDetail(Base):
    __tablename__ = "attempt_details"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    attempt_id      = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_id     = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option = Column(Enum("A", "B", "C", "D"), nullable=True)
    is_correct      = Column(Boolean, default=False)
    time_spent      = Column(Integer, default=0)
    points_earned   = Column(Integer, default=0)
    attempt         = relationship("QuizAttempt", back_populates="details")


class Leaderboard(Base):
    __tablename__ = "leaderboard"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    user_id        = Column(Integer, ForeignKey("users.id"), unique=True)
    total_points   = Column(Integer, default=0)
    total_attempts = Column(Integer, default=0)
    best_streak    = Column(Integer, default=0)
    rank_position  = Column(Integer, nullable=True)
