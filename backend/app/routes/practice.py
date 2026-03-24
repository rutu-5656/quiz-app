import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.subject import Subject, Chapter
from app.models.question import Question
from app.models.attempt import QuizAttempt, AttemptDetail
from app.schemas.quiz import PracticeSubmitRequest
from app.routes.auth import get_current_user

router = APIRouter(prefix="/practice", tags=["Practice"])


# ── Subjects list ─────────────────────────────────────────────────────────────
@router.get("/subjects")
def get_subjects(db: Session = Depends(get_db)):
    subjects = db.query(Subject).all()
    return [
        {"id": s.id, "name": s.name, "code": s.code,
         "semester": s.semester, "scheme": s.scheme}
        for s in subjects
    ]


# ── Chapters for a subject ────────────────────────────────────────────────────
@router.get("/subjects/{subject_id}/chapters")
def get_chapters(subject_id: int, db: Session = Depends(get_db)):
    chapters = db.query(Chapter).filter(Chapter.subject_id == subject_id).all()
    return [
        {"id": c.id, "chapter_number": c.chapter_number, "title": c.title}
        for c in chapters
    ]


# ── Start practice quiz ───────────────────────────────────────────────────────
@router.get("/start")
def start_practice(
    subject_id: int,
    chapter_id: int = None,
    count:      int = 10,
    db:         Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    query = db.query(Question)
    if chapter_id:
        query = query.filter(Question.chapter_id == chapter_id)
    else:
        # All chapters of this subject
        chapter_ids = [
            c.id for c in db.query(Chapter).filter(Chapter.subject_id == subject_id).all()
        ]
        query = query.filter(Question.chapter_id.in_(chapter_ids))

    questions = query.all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found")

    selected = random.sample(questions, min(count, len(questions)))
    return [
        {
            "id":            q.id,
            "question_text": q.question_text,
            "option_a":      q.option_a,
            "option_b":      q.option_b,
            "option_c":      q.option_c,
            "option_d":      q.option_d,
            "difficulty":    q.difficulty,
        }
        for q in selected
    ]


# ── Submit practice quiz ──────────────────────────────────────────────────────
@router.post("/submit")
def submit_practice(
    payload:      PracticeSubmitRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    question_ids = [a.question_id for a in payload.answers]
    questions    = {q.id: q for q in db.query(Question).filter(Question.id.in_(question_ids)).all()}

    correct = 0
    details = []

    for ans in payload.answers:
        q          = questions.get(ans.question_id)
        is_correct = q is not None and ans.selected_option == q.correct_option
        if is_correct:
            correct += 1
        details.append({
            "question_id":     ans.question_id,
            "selected_option": ans.selected_option,
            "correct_option":  q.correct_option if q else None,
            "is_correct":      is_correct,
            "explanation":     q.explanation if q else "",
        })

    total  = len(payload.answers)
    score  = round((correct / total) * 100, 2) if total else 0

    attempt = QuizAttempt(
        user_id         = current_user.id,
        subject_id      = payload.subject_id,
        chapter_id      = payload.chapter_id,
        mode            = "practice",
        total_questions = total,
        correct_answers = correct,
        score           = score,
        time_taken      = payload.time_taken,
    )
    db.add(attempt)
    db.flush()

    for i, ans in enumerate(payload.answers):
        d = details[i]
        db.add(AttemptDetail(
            attempt_id      = attempt.id,
            question_id     = ans.question_id,
            selected_option = ans.selected_option,
            is_correct      = d["is_correct"],
        ))
    db.commit()

    return {
        "attempt_id":      attempt.id,
        "score":           score,
        "correct_answers": correct,
        "total_questions": total,
        "details":         details,
    }


# ── History ───────────────────────────────────────────────────────────────────
@router.get("/history")
def get_history(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id, QuizAttempt.mode == "practice")
        .order_by(QuizAttempt.attempted_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id":              a.id,
            "subject_id":      a.subject_id,
            "chapter_id":      a.chapter_id,
            "score":           a.score,
            "correct_answers": a.correct_answers,
            "total_questions": a.total_questions,
            "time_taken":      a.time_taken,
            "attempted_at":    str(a.attempted_at),
        }
        for a in attempts
    ]


# ── Weak topic analysis ───────────────────────────────────────────────────────
@router.get("/analysis")
def get_analysis(
    subject_id:   int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    chapters = db.query(Chapter).filter(Chapter.subject_id == subject_id).all()
    result   = []

    for ch in chapters:
        q_ids = [q.id for q in db.query(Question).filter(Question.chapter_id == ch.id).all()]
        if not q_ids:
            continue

        details = (
            db.query(AttemptDetail)
            .join(QuizAttempt)
            .filter(
                QuizAttempt.user_id == current_user.id,
                AttemptDetail.question_id.in_(q_ids),
            )
            .all()
        )

        if not details:
            result.append({"chapter": ch.title, "attempted": 0, "accuracy": None})
            continue

        correct  = sum(1 for d in details if d.is_correct)
        accuracy = round((correct / len(details)) * 100, 1)
        result.append({
            "chapter":   ch.title,
            "attempted": len(details),
            "accuracy":  accuracy,
            "status":    "weak" if accuracy < 50 else ("average" if accuracy < 75 else "strong"),
        })

    return result
