"""
Scoring engine for compete mode.

Formula:
  Base points per correct answer  = 100
  Speed bonus (time_spent in sec) = +50 (0-3s) | +30 (3-6s) | +10 (6-10s) | 0 (>10s)
  Streak bonus                    = +25 (3 streak) | +50 (5 streak) | +100 (10 streak)
  Wrong answer                    = 0 pts
"""

SPEED_TIERS = [
    (3,  50),
    (6,  30),
    (10, 10),
]

STREAK_BONUSES = {
    3:  25,
    5:  50,
    10: 100,
}


def calc_question_points(is_correct: bool, time_spent: int) -> int:
    if not is_correct:
        return 0
    base  = 100
    bonus = 0
    for max_sec, pts in SPEED_TIERS:
        if time_spent <= max_sec:
            bonus = pts
            break
    return base + bonus


def calc_streak_bonus(streak: int) -> int:
    return STREAK_BONUSES.get(streak, 0)


def calculate_attempt_score(answers: list[dict]) -> dict:
    """
    answers: list of {is_correct: bool, time_spent: int}
    Returns: {
        total_points, correct_answers, max_streak,
        per_question: [{points_earned, is_correct, time_spent}]
    }
    """
    total_points    = 0
    correct_answers = 0
    current_streak  = 0
    max_streak      = 0
    per_question    = []

    for ans in answers:
        is_correct  = ans["is_correct"]
        time_spent  = ans.get("time_spent", 0)

        pts = calc_question_points(is_correct, time_spent)

        if is_correct:
            correct_answers += 1
            current_streak  += 1
            max_streak       = max(max_streak, current_streak)
            streak_bonus     = calc_streak_bonus(current_streak)
            pts             += streak_bonus
        else:
            current_streak = 0
            streak_bonus   = 0

        total_points += pts
        per_question.append({
            "points_earned": pts,
            "is_correct":    is_correct,
            "time_spent":    time_spent,
        })

    return {
        "total_points":    total_points,
        "correct_answers": correct_answers,
        "max_streak":      max_streak,
        "per_question":    per_question,
    }
