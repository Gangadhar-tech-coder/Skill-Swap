"""
Session router: request, accept, reject, complete sessions, and rate partners.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import User, Session as SessionModel, SessionStatus, Transaction, TransactionType, Review, ReviewTargetType
from ..schemas import SessionRequest, SessionResponse, ReviewCreate
from ..auth import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])


@router.post("/request", response_model=SessionResponse, status_code=201)
def request_session(
    req: SessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a skill exchange request to another user.
    The current user becomes the learner requesting a session with the teacher.
    """
    if req.teacher_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot request a session with yourself")

    teacher = db.query(User).filter(User.id == req.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Check if learner has enough credits
    if current_user.skill_credits < req.duration:
        raise HTTPException(status_code=400, detail="Not enough skill credits")

    # Skill Swap Restriction: A user cannot participate in more than one skill swap session at the same time
    active_sessions = db.query(SessionModel).filter(
        (SessionModel.teacher_id == current_user.id) | (SessionModel.learner_id == current_user.id),
        SessionModel.status.in_([SessionStatus.PENDING, SessionStatus.ACCEPTED, SessionStatus.IN_PROGRESS])
    ).first()
    if active_sessions:
        raise HTTPException(status_code=400, detail="You already have an active or pending skill swap session. Complete or cancel it first.")

    new_session = SessionModel(
        teacher_id=req.teacher_id,
        learner_id=current_user.id,
        skill_offered=req.skill_offered,
        skill_requested=req.skill_requested,
        duration=req.duration,
        preferred_time=req.preferred_time or "",
        status=SessionStatus.PENDING,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.post("/accept/{session_id}", response_model=SessionResponse)
def accept_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a pending session request. Only the teacher can accept."""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the teacher can accept")
    if session.status != SessionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Session is not pending")

    # Check for active sessions for either user
    active_sessions = db.query(SessionModel).filter(
        (SessionModel.teacher_id.in_([current_user.id, session.learner_id])) | 
        (SessionModel.learner_id.in_([current_user.id, session.learner_id])),
        SessionModel.status.in_([SessionStatus.ACCEPTED, SessionStatus.IN_PROGRESS])
    ).first()
    if active_sessions:
        raise HTTPException(status_code=400, detail="One of the participants is already in an active session")

    session.status = SessionStatus.ACCEPTED
    db.commit()
    db.refresh(session)
    return session


@router.post("/reject/{session_id}", response_model=SessionResponse)
def reject_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject a pending session request. Only the teacher can reject."""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the teacher can reject")
    if session.status != SessionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Session is not pending")

    session.status = SessionStatus.REJECTED
    db.commit()
    db.refresh(session)
    return session


@router.post("/start/{session_id}", response_model=SessionResponse)
def start_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start an accepted session. Either teacher or learner can start."""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user.id not in [session.teacher_id, session.learner_id]:
        raise HTTPException(status_code=403, detail="Not a participant")
    if session.status != SessionStatus.ACCEPTED:
        raise HTTPException(status_code=400, detail="Session must be accepted first")

    session.status = SessionStatus.IN_PROGRESS
    db.commit()
    db.refresh(session)
    return session


@router.post("/complete/{session_id}", response_model=SessionResponse)
def complete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Complete a session and transfer skill credits.
    Teacher earns credits, learner spends credits.
    """
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user.id not in [session.teacher_id, session.learner_id]:
        raise HTTPException(status_code=403, detail="Not a participant")
    if session.status not in [SessionStatus.ACCEPTED, SessionStatus.IN_PROGRESS]:
        raise HTTPException(status_code=400, detail="Session cannot be completed in current state")

    # Transfer credits
    teacher = db.query(User).filter(User.id == session.teacher_id).first()
    learner = db.query(User).filter(User.id == session.learner_id).first()

    teacher.skill_credits += session.duration
    learner.skill_credits -= session.duration

    # Create transaction records
    db.add(Transaction(
        user_id=teacher.id, credits=session.duration,
        type=TransactionType.EARNED,
        description=f"Taught {session.skill_offered} to {learner.name}",
        session_id=session.id
    ))
    db.add(Transaction(
        user_id=learner.id, credits=session.duration,
        type=TransactionType.SPENT,
        description=f"Learned {session.skill_requested} from {teacher.name}",
        session_id=session.id
    ))

    session.status = SessionStatus.COMPLETED
    session.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


@router.post("/rate/{session_id}")
def rate_session(
    session_id: int,
    rating: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Rate your partner after a completed session.
    Updates the session rating and recalculates the partner's reputation score.
    """
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != SessionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only rate completed sessions")
    if current_user.id not in [session.teacher_id, session.learner_id]:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Check if review already exists
    existing = db.query(Review).filter(
        Review.author_id == current_user.id,
        Review.target_id == session_id,
        Review.target_type == ReviewTargetType.SESSION
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already rated this session")

    target_user_id = session.teacher_id if current_user.id == session.learner_id else session.learner_id
    
    new_review = Review(
        author_id=current_user.id,
        target_type=ReviewTargetType.SESSION,
        target_id=session.id,
        target_user_id=target_user_id,
        rating=rating.rating,
        content=rating.content
    )
    db.add(new_review)
    db.commit()

    _update_reputation(db, target_user_id)
    return {"message": "Rating submitted successfully", "rating": rating.rating}


@router.get("/", response_model=List[SessionResponse])
def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all sessions for the current user (as teacher or learner)."""
    sessions = db.query(SessionModel).options(
        joinedload(SessionModel.teacher),
        joinedload(SessionModel.learner)
    ).filter(
        (SessionModel.teacher_id == current_user.id) |
        (SessionModel.learner_id == current_user.id)
    ).order_by(SessionModel.created_at.desc()).all()
    return sessions


def _update_reputation(db: Session, user_id: int):
    """Recalculate a user's reputation score from all their reviews."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return


