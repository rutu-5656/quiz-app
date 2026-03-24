import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.subject import Subject, Chapter
from app.models.question import Question
from app.models.attempt import QuizAttempt, AttemptDetail, Leaderboard
from app.schemas.quiz import CompeteSubmitRequest
from app.routes.auth import get_current_user
from app.core.scoring import calculate_attempt_score

router = APIRouter(prefix="/compete", tags=["Compete"])

COMPETE_QUESTION_COUNT = 10
COMPETE_TIME_LIMIT     = 120   # seconds per quiz


# ── Global leaderboard ────────────────────────────────────────────────────────
@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    rows = (
        db.query(Leaderboard, User.name)
        .join(User, Leaderboard.user_id == User.id)
        .order_by(Leaderboard.total_points.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "rank":           idx + 1,
            "name":           name,
            "total_points":   lb.total_points,
            "total_attempts": lb.total_attempts,
            "best_streak":    lb.best_streak,
        }
        for idx, (lb, name) in enumerate(rows)
    ]


# ── Start compete quiz ────────────────────────────────────────────────────────
@router.get("/start")
def start_compete(
    subject_id:   int,
    chapter_id:   int = None,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    query = db.query(Question)
    if chapter_id:
        query = query.filter(Question.chapter_id == chapter_id)
    else:
        chapter_ids = [
            c.id for c in db.query(Chapter).filter(Chapter.subject_id == subject_id).all()
        ]
        query = query.filter(Question.chapter_id.in_(chapter_ids))

    questions = query.all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found")

    selected = random.sample(questions, min(COMPETE_QUESTION_COUNT, len(questions)))
    return {
        "time_limit": COMPETE_TIME_LIMIT,
        "questions": [
            {
                "id":            q.id,
                "question_text": q.question_text,
                "option_a":      q.option_a,
                "option_b":      q.option_b,
                "option_c":      q.option_c,
                "option_d":      q.option_d,
            }
            for q in selected
        ],
    }


# ── Submit compete quiz ───────────────────────────────────────────────────────
@router.post("/submit")
def submit_compete(
    payload:      CompeteSubmitRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    question_ids = [a.question_id for a in payload.answers]
    questions    = {q.id: q for q in db.query(Question).filter(Question.id.in_(question_ids)).all()}

    # Build answers for scoring engine
    scored_answers = []
    for ans in payload.answers:
        q          = questions.get(ans.question_id)
        is_correct = q is not None and ans.selected_option == q.correct_option
        scored_answers.append({"is_correct": is_correct, "time_spent": ans.time_spent})

    result = calculate_attempt_score(scored_answers)

    # Save attempt
    attempt = QuizAttempt(
        user_id         = current_user.id,
        subject_id      = payload.subject_id,
        chapter_id      = payload.chapter_id,
        mode            = "compete",
        total_questions = len(payload.answers),
        correct_answers = result["correct_answers"],
        score           = round((result["correct_answers"] / len(payload.answers)) * 100, 2),
        compete_points  = result["total_points"],
        max_streak      = result["max_streak"],
        time_taken      = payload.time_taken,
    )
    db.add(attempt)
    db.flush()

    for i, ans in enumerate(payload.answers):
        pq = result["per_question"][i]
        db.add(AttemptDetail(
            attempt_id      = attempt.id,
            question_id     = ans.question_id,
            selected_option = ans.selected_option,
            is_correct      = pq["is_correct"],
            time_spent      = pq["time_spent"],
            points_earned   = pq["points_earned"],
        ))

    # Update leaderboard
    lb = db.query(Leaderboard).filter(Leaderboard.user_id == current_user.id).first()
    if lb:
        lb.total_points   += result["total_points"]
        lb.total_attempts += 1
        lb.best_streak     = max(lb.best_streak, result["max_streak"])

    # Update user total_points
    current_user.total_points   += result["total_points"]
    current_user.compete_attempts += 1

    db.commit()

    # Recalculate ranks
    _recalculate_ranks(db)

    # Get updated leaderboard
    updated_lb = get_leaderboard(db)
    user_rank  = next((r for r in updated_lb if r["name"] == current_user.name), None)

    return {
        "attempt_id":      attempt.id,
        "total_points":    result["total_points"],
        "correct_answers": result["correct_answers"],
        "total_questions": len(payload.answers),
        "max_streak":      result["max_streak"],
        "your_rank":       user_rank,
        "leaderboard":     updated_lb[:10],
    }


# ── Attempt result ────────────────────────────────────────────────────────────
@router.get("/result/{attempt_id}")
def get_result(
    attempt_id:   int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.user_id == current_user.id,
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    details = db.query(AttemptDetail).filter(AttemptDetail.attempt_id == attempt_id).all()
    q_ids   = [d.question_id for d in details]
    qs      = {q.id: q for q in db.query(Question).filter(Question.id.in_(q_ids)).all()}

    return {
        "attempt_id":      attempt.id,
        "score":           attempt.score,
        "compete_points":  attempt.compete_points,
        "correct_answers": attempt.correct_answers,
        "total_questions": attempt.total_questions,
        "max_streak":      attempt.max_streak,
        "time_taken":      attempt.time_taken,
        "details": [
            {
                "question_text":   qs[d.question_id].question_text if d.question_id in qs else "",
                "selected_option": d.selected_option,
                "correct_option":  qs[d.question_id].correct_option if d.question_id in qs else "",
                "is_correct":      d.is_correct,
                "points_earned":   d.points_earned,
                "time_spent":      d.time_spent,
                "explanation":     qs[d.question_id].explanation if d.question_id in qs else "",
            }
            for d in details
        ],
    }


# ── Internal helper ───────────────────────────────────────────────────────────
def _recalculate_ranks(db: Session):
    rows = (
        db.query(Leaderboard)
        .order_by(Leaderboard.total_points.desc())
        .all()
    )
    for idx, row in enumerate(rows):
        row.rank_position = idx + 1
    db.commit()
