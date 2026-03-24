from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.models import *  # registers all models with Base
from app.routes import auth, practice, compete, admin

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EES Quiz App",
    description="MSBTE Exam Prep Quiz — Practice & Compete",
    version="1.0.0",
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(practice.router)
app.include_router(compete.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "Quiz App API is running 🚀"}
