"""
Admin router: user management, session overview, and moderation.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, Session as SessionModel, PremiumTeacherRequest, VerificationStatus, Course, Review
from ..schemas import AdminUserResponse, SessionResponse, PremiumRequestResponse
from ..auth import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users", response_model=List[AdminUserResponse])
def list_users(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """List all users in the system. Admin only."""
    return db.query(User).order_by(User.created_at.desc()).all()
@router.get("/sessions", response_model=List[SessionResponse])
def list_sessions(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """List all sessions in the system. Admin only."""
    return db.query(SessionModel).order_by(SessionModel.created_at.desc()).limit(100).all()


@router.post("/ban/{user_id}")
def ban_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Ban a user by ID. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot ban an admin")
    user.is_banned = True
    db.commit()
    return {"message": f"User {user.name} has been banned"}


@router.post("/unban/{user_id}")
def unban_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Unban a user by ID. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_banned = False
    db.commit()
    return {"message": f"User {user.name} has been unbanned"}


@router.get("/premium-requests", response_model=List[PremiumRequestResponse])
def list_premium_requests(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """List all pending premium teacher requests."""
    return db.query(PremiumTeacherRequest).order_by(PremiumTeacherRequest.submitted_at.desc()).all()


@router.post("/premium-requests/{req_id}/approve")
def approve_premium_request(
    req_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Approve a premium teacher request."""
    req = db.query(PremiumTeacherRequest).filter(PremiumTeacherRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req.status = VerificationStatus.APPROVED
    
    user = db.query(User).filter(User.id == req.user_id).first()
    if user:
        user.is_premium_teacher = True
        user.verification_status = VerificationStatus.APPROVED
        user.license_document = req.document_url
        
    db.commit()
    return {"message": "Request approved successfully"}


@router.post("/premium-requests/{req_id}/reject")
def reject_premium_request(
    req_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Reject a premium teacher request."""
    req = db.query(PremiumTeacherRequest).filter(PremiumTeacherRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req.status = VerificationStatus.REJECTED
    
    user = db.query(User).filter(User.id == req.user_id).first()
    if user:
        user.verification_status = VerificationStatus.REJECTED
        
    db.commit()
    return {"message": "Request rejected"}


@router.get("/stats")
def get_stats(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get expanded platform statistics."""
    total_users = db.query(User).count()
    total_sessions = db.query(SessionModel).count()
    completed_sessions = db.query(SessionModel).filter(
        SessionModel.status == "completed"
    ).count()
    banned_users = db.query(User).filter(User.is_banned == True).count()
    total_courses = db.query(Course).count()
    pending_premium = db.query(PremiumTeacherRequest).filter(PremiumTeacherRequest.status == VerificationStatus.PENDING).count()

    return {
        "total_users": total_users,
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "banned_users": banned_users,
        "total_courses": total_courses,
        "pending_premium": pending_premium
    }
