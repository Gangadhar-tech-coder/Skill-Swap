"""
SkillSwap Backend - Main FastAPI Application

Entry point that configures CORS, includes all routers,
and creates database tables on startup.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import (
    auth_router,
    user_router,
    skill_router,
    session_router,
    wallet_router,
    match_router,
    admin_router,
    ws_router,
    premium_router,
    course_router,
)
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="SkillSwap API",
    description="Real-Time Skill Barter Platform - Exchange skills, earn credits, grow together.",
    version="1.0.0",
)

# CORS configuration for frontend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Include API routers
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(skill_router.router)
app.include_router(session_router.router)
app.include_router(wallet_router.router)
app.include_router(match_router.router)
app.include_router(admin_router.router)
app.include_router(ws_router.router)
app.include_router(premium_router.router)
app.include_router(course_router.router)


@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "name": "SkillSwap API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/api/health")
def health_check():
    """API health check."""
    return {"status": "healthy"}


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 