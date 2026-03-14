"""
AI Matching router: get skill match suggestions.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User
from ..schemas import MatchResult, UserBrief
from ..auth import get_current_user
from ..services.matching import find_matches

router = APIRouter(prefix="/api/match", tags=["AI Matching"])


@router.get("/suggestions", response_model=List[MatchResult])
def get_match_suggestions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get AI-powered skill match suggestions for the current user.
    Returns users sorted by compatibility score based on skill overlap,
    reputation, and availability.
    """
    matches = find_matches(current_user, db, limit=10)

    results = []
    for match in matches:
        user = match["user"]
        results.append(MatchResult(
            user=UserBrief(
                id=user.id,
                name=user.name,
                location=user.location,
                reputation_score=user.reputation_score,
                skill_credits=user.skill_credits
            ),
            compatibility_score=match["compatibility_score"],
            matching_skills=match["matching_skills"],
            skills_they_teach=match["skills_they_teach"],
            skills_they_learn=match["skills_they_learn"],
        ))
    return results
