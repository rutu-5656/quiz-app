from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.attempt import Leaderboard
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token, decode_token

router       = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Register ──────────────────────────────────────────────────────────────────
@router.post("/register", status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name          = payload.name,
        email         = payload.email,
        password_hash = hash_password(payload.password),
        role          = "student",
    )
    db.add(user)
    db.flush()
    db.add(Leaderboard(user_id=user.id))
    db.commit()
    return {"message": "Registration successful", "user_id": user.id}


# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, role=user.role, name=user.name)


# ── Dependencies ──────────────────────────────────────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ── Me ────────────────────────────────────────────────────────────────────────
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id":           current_user.id,
        "name":         current_user.name,
        "email":        current_user.email,
        "role":         current_user.role,
        "total_points": current_user.total_points,
    }
