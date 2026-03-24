"""
seed_ees.py — Run this ONCE to populate EES data into MySQL.

Usage:
    python seed_ees.py

Requirements:
    pip install sqlalchemy pymysql python-dotenv
"""

import json
import os
from dotenv import load_dotenv
from sqlalchemy import (
    create_engine, Column, Integer, String,
    Text, Enum, ForeignKey, TIMESTAMP
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import sqlalchemy.sql.expression as expr

load_dotenv()

# ── DB connection ─────────────────────────────────────────────────────────────
DB_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:password@localhost:3306/quiz_db"
)
engine  = create_engine(DB_URL, echo=False)
Session = sessionmaker(bind=engine)
Base    = declarative_base()

# ── Models (mirror your actual models) ───────────────────────────────────────

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

class Question(Base):
    __tablename__ = "questions"
    id             = Column(Integer, primary_key=True, autoincrement=True)
    chapter_id     = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    question_text  = Column(Text, nullable=False)
    option_a       = Column(String(255))
    option_b       = Column(String(255))
    option_c       = Column(String(255))
    option_d       = Column(String(255))
    correct_option = Column(Enum("A","B","C","D"), nullable=False)
    explanation    = Column(Text)
    difficulty     = Column(Enum("easy","medium","hard"), default="medium")
    created_by     = Column(Integer, nullable=True)
    chapter        = relationship("Chapter", back_populates="questions")

# ── Seed logic ────────────────────────────────────────────────────────────────

def seed():
    Base.metadata.create_all(engine)   # create tables if not exist
    session = Session()

    # Load parsed JSON
    json_path = os.path.join(os.path.dirname(__file__), "ees_seed_data.json")
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    sub_data = data["subject"]
    ch_data  = data["chapters"]
    q_data   = data["questions"]

    # ── 1. Subject ──
    existing_subject = session.query(Subject).filter_by(code=sub_data["code"]).first()
    if existing_subject:
        print(f"⚠️  Subject '{sub_data['name']}' already exists. Skipping insert.")
        subject = existing_subject
    else:
        subject = Subject(
            name     = sub_data["name"],
            code     = sub_data["code"],
            semester = sub_data["semester"],
            scheme   = sub_data["scheme"],
        )
        session.add(subject)
        session.flush()   # get subject.id without committing
        print(f"✅ Subject inserted: {subject.name} (id={subject.id})")

    # ── 2. Chapters ──
    chapter_map = {}   # title → Chapter object

    for ch in ch_data:
        existing_ch = session.query(Chapter).filter_by(
            subject_id=subject.id, chapter_number=ch["chapter_number"]
        ).first()

        if existing_ch:
            print(f"⚠️  Chapter '{ch['title']}' already exists. Skipping.")
            chapter_map[ch["title"]] = existing_ch
        else:
            chapter = Chapter(
                subject_id     = subject.id,
                chapter_number = ch["chapter_number"],
                title          = ch["title"],
            )
            session.add(chapter)
            session.flush()
            chapter_map[ch["title"]] = chapter
            print(f"✅ Chapter inserted: {chapter.title} (id={chapter.id})")

    # ── 3. Questions ──
    inserted = 0
    skipped  = 0

    for q in q_data:
        ch_obj = chapter_map.get(q["chapter_title"])
        if not ch_obj:
            print(f"  ❌ Chapter not found: {q['chapter_title']}")
            continue

        # Avoid duplicate questions
        exists = session.query(Question).filter_by(
            chapter_id    = ch_obj.id,
            question_text = q["question_text"]
        ).first()

        if exists:
            skipped += 1
            continue

        question = Question(
            chapter_id     = ch_obj.id,
            question_text  = q["question_text"],
            option_a       = q["option_a"],
            option_b       = q["option_b"],
            option_c       = q["option_c"],
            option_d       = q["option_d"],
            correct_option = q["correct_option"],
            explanation    = q.get("explanation", ""),
            difficulty     = q.get("difficulty", "medium"),
        )
        session.add(question)
        inserted += 1

    session.commit()
    session.close()

    print(f"\n🎉 Seed complete!")
    print(f"   ✅ Questions inserted : {inserted}")
    print(f"   ⏭️  Questions skipped  : {skipped} (already existed)")
    print(f"   📊 Total in JSON      : {len(q_data)}")

if __name__ == "__main__":
    seed()
