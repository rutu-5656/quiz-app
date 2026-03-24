from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id       = Column(Integer, primary_key=True, autoincrement=True)
    name     = Column(String(150), nullable=False)
    code     = Column(String(20))
    semester = Column(Integer)
    scheme   = Column(String(10))
    chapters = relationship("Chapter", back_populates="subject")


class Chapter(Base):
    __tablename__ = "chapters"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    subject_id     = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    chapter_number = Column(Integer)
    title          = Column(String(200))
    subject        = relationship("Subject", back_populates="chapters")
    questions      = relationship("Question", back_populates="chapter")
