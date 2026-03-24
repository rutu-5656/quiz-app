from pydantic import BaseModel
from typing import Optional


# ── Practice ──────────────────────────────────────────────────────────────────

class AnswerItem(BaseModel):
    question_id:     int
    selected_option: Optional[str] = None   # A/B/C/D or None (skipped)


class PracticeSubmitRequest(BaseModel):
    subject_id:  int
    chapter_id:  Optional[int] = None
    answers:     list[AnswerItem]
    time_taken:  int


# ── Compete ───────────────────────────────────────────────────────────────────

class CompeteAnswerItem(BaseModel):
    question_id:     int
    selected_option: Optional[str] = None
    time_spent:      int = 0


class CompeteSubmitRequest(BaseModel):
    subject_id:  int
    chapter_id:  Optional[int] = None
    answers:     list[CompeteAnswerItem]
    time_taken:  int


# ── Admin ─────────────────────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    chapter_id:     int
    question_text:  str
    option_a:       str
    option_b:       str
    option_c:       str
    option_d:       str
    correct_option: str
    explanation:    Optional[str] = ""
    difficulty:     Optional[str] = "medium"


class QuestionUpdate(BaseModel):
    question_text:  Optional[str] = None
    option_a:       Optional[str] = None
    option_b:       Optional[str] = None
    option_c:       Optional[str] = None
    option_d:       Optional[str] = None
    correct_option: Optional[str] = None
    explanation:    Optional[str] = None
    difficulty:     Optional[str] = None
