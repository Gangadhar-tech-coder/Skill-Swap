"""
User profile router: view and update profile.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserProfile, UserUpdate
from ..auth import get_current_user

router = APIRouter(prefix="/api/user", tags=["User Profile"])

@router.get("/profile", response_model=UserProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    """Get the current user's full profile including skills."""
    return current_user
@router.get("/profile/{user_id}", response_model=UserProfile)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user's public profile."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/profile", response_model=UserProfile)
def update_profile(
    updates: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the current user's profile fields."""
    if updates.name is not None:
        current_user.name = updates.name
    if updates.bio is not None:
        current_user.bio = updates.bio
    if updates.location is not None:
        current_user.location = updates.location
    if updates.availability is not None:
        current_user.availability = updates.availability

    db.commit()
    db.refresh(current_user)
    return current_user
