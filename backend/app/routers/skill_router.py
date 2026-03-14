"""
Skills router: add, delete, list own skills, and browse marketplace.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List

from ..database import get_db
from ..models import User, Skill, SkillType
from ..schemas import SkillCreate, SkillResponse, SkillBrowse
from ..auth import get_current_user

router = APIRouter(prefix="/api/skills", tags=["Skills"])


@router.post("/add", response_model=SkillResponse, status_code=201)
def add_skill(
    skill_data: SkillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a new skill to the current user's profile.
    skill_type must be 'teach' or 'learn'.
    """
    new_skill = Skill(
        user_id=current_user.id,
        skill_name=skill_data.skill_name,
        skill_type=SkillType(skill_data.skill_type),
        skill_level=skill_data.skill_level or "intermediate",
        description=skill_data.description or "",
    )
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill


@router.delete("/{skill_id}", status_code=204)
def delete_skill(
    skill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a skill from the current user's profile."""
    skill = db.query(Skill).filter(
        Skill.id == skill_id, Skill.user_id == current_user.id
    ).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()


@router.get("/my", response_model=List[SkillResponse])
def get_my_skills(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all skills for the current user."""
    return db.query(Skill).filter(Skill.user_id == current_user.id).all()


@router.get("/browse", response_model=List[SkillBrowse])
def browse_skills(
    search: Optional[str] = Query(None, description="Search by skill name"),
    location: Optional[str] = Query(None, description="Filter by location"),
    skill_type: Optional[str] = Query("teach", description="Filter by teach/learn"),
    min_rating: Optional[float] = Query(None, description="Minimum user rating"),
    db: Session = Depends(get_db)
):
    """
    Browse all skills in the marketplace with optional filters.
    Returns skills along with the user info who offers them.
    """
    query = db.query(Skill).options(joinedload(Skill.user))

    # Filter by skill type
    if skill_type:
        query = query.filter(Skill.skill_type == SkillType(skill_type))

    # Search by skill name
    if search:
        query = query.filter(Skill.skill_name.ilike(f"%{search}%"))

    # Filter by user location
    if location:
        query = query.join(User).filter(User.location.ilike(f"%{location}%"))

    # Filter by minimum rating
    if min_rating:
        query = query.join(User).filter(User.reputation_score >= min_rating)

    # Exclude banned users
    query = query.join(User, isouter=True).filter(User.is_banned == False)

    results = query.limit(50).all()
    return results
