"""
Premium Teacher router: handle applications for premium status.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, PremiumTeacherRequest, VerificationStatus
from ..schemas import PremiumRequestCreate, PremiumRequestResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/premium", tags=["Premium"])


@router.post("/apply", response_model=PremiumRequestResponse)
def apply_premium(
    req: PremiumRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Apply to become a Premium Teacher.
    Requires uploading/providing a link to a license document.
    """
    if current_user.is_premium_teacher:
        raise HTTPException(status_code=400, detail="You are already a Premium Teacher")

    # Check if there's already a pending request
    existing = db.query(PremiumTeacherRequest).filter(
        PremiumTeacherRequest.user_id == current_user.id,
        PremiumTeacherRequest.status == VerificationStatus.PENDING
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending application")

    new_request = PremiumTeacherRequest(
        user_id=current_user.id,
        document_url=req.document_url,
        status=VerificationStatus.PENDING
    )
    db.add(new_request)
    
    # Update user status to indicate they have a pending app
    current_user.verification_status = VerificationStatus.PENDING
    db.commit()
    db.refresh(new_request)
    
    return new_request


@router.get("/my-status", response_model=PremiumRequestResponse)
def get_premium_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the status of the current user's latest premium application."""
    req = db.query(PremiumTeacherRequest).filter(
        PremiumTeacherRequest.user_id == current_user.id
    ).order_by(PremiumTeacherRequest.submitted_at.desc()).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="No applications found")
        
    return req
