from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    chapter_id     = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    question_text  = Column(Text, nullable=False)
    option_a       = Column(String(255))
    option_b       = Column(String(255))
    option_c       = Column(String(255))
    option_d       = Column(String(255))
    correct_option = Column(Enum("A", "B", "C", "D"), nullable=False)
    explanation    = Column(Text)
    difficulty     = Column(Enum("easy", "medium", "hard"), default="medium")
    created_by     = Column(Integer, ForeignKey("users.id"), nullable=True)
    chapter        = relationship("Chapter", back_populates="questions")
