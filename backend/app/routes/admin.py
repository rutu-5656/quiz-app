from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.subject import Subject, Chapter
from app.models.question import Question
from app.models.attempt import QuizAttempt, Leaderboard
from app.schemas.quiz import QuestionCreate, QuestionUpdate
from app.routes.auth import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Stats ─────────────────────────────────────────────────────────────────────
@router.get("/stats")
def get_stats(
    db:    Session = Depends(get_db),
    admin: User    = Depends(require_admin),
):
    return {
        "total_users":     db.query(User).count(),
        "total_questions": db.query(Question).count(),
        "total_attempts":  db.query(QuizAttempt).count(),
        "total_subjects":  db.query(Subject).count(),
    }


# ── Users ─────────────────────────────────────────────────────────────────────
@router.get("/users")
def get_users(
    db:    Session = Depends(get_db),
    admin: User    = Depends(require_admin),
):
    users = db.query(User).all()
    return [
        {
            "id":              u.id,
            "name":            u.name,
            "email":           u.email,
            "role":            u.role,
            "total_points":    u.total_points,
            "compete_attempts": u.compete_attempts,
            "created_at":      str(u.created_at),
        }
        for u in users
    ]


# ── Subjects ──────────────────────────────────────────────────────────────────
@router.post("/subjects", status_code=201)
def add_subject(
    name:     str,
    code:     str,
    semester: int,
    scheme:   str,
    db:       Session = Depends(get_db),
    admin:    User    = Depends(require_admin),
):
    s = Subject(name=name, code=code, semester=semester, scheme=scheme)
    db.add(s)
    db.commit()
    return {"message": "Subject added", "id": s.id}


# ── Chapters ──────────────────────────────────────────────────────────────────
@router.post("/chapters", status_code=201)
def add_chapter(
    subject_id:     int,
    chapter_number: int,
    title:          str,
    db:             Session = Depends(get_db),
    admin:          User    = Depends(require_admin),
):
    ch = Chapter(subject_id=subject_id, chapter_number=chapter_number, title=title)
    db.add(ch)
    db.commit()
    return {"message": "Chapter added", "id": ch.id}


# ── Questions CRUD ────────────────────────────────────────────────────────────
@router.get("/questions")
def list_questions(
    chapter_id: int = None,
    db:         Session = Depends(get_db),
    admin:      User    = Depends(require_admin),
):
    query = db.query(Question)
    if chapter_id:
        query = query.filter(Question.chapter_id == chapter_id)
    questions = query.all()
    return [
        {
            "id":             q.id,
            "chapter_id":     q.chapter_id,
            "question_text":  q.question_text,
            "option_a":       q.option_a,
            "option_b":       q.option_b,
            "option_c":       q.option_c,
            "option_d":       q.option_d,
            "correct_option": q.correct_option,
            "explanation":    q.explanation,
            "difficulty":     q.difficulty,
        }
        for q in questions
    ]


@router.post("/questions", status_code=201)
def add_question(
    payload: QuestionCreate,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(require_admin),
):
    q = Question(**payload.model_dump(), created_by=admin.id)
    db.add(q)
    db.commit()
    return {"message": "Question added", "id": q.id}


@router.put("/questions/{question_id}")
def update_question(
    question_id: int,
    payload:     QuestionUpdate,
    db:          Session = Depends(get_db),
    admin:       User    = Depends(require_admin),
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(q, field, value)
    db.commit()
    return {"message": "Question updated"}


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db:          Session = Depends(get_db),
    admin:       User    = Depends(require_admin),
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"message": "Question deleted"}
