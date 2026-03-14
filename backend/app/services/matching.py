"""
AI Skill Matching service.
Uses cosine similarity to find the best skill barter partners based on
skill compatibility, reputation, and availability overlap.
"""
import numpy as np
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session

from ..models import User, Skill, SkillType


def get_all_skill_names(db: Session) -> List[str]:
    """Get a sorted list of all unique skill names in the system."""
    skills = db.query(Skill.skill_name).distinct().all()
    return sorted(set(s[0].lower() for s in skills))


def encode_skills(user_skills: List[Skill], all_skills: List[str], skill_type: SkillType) -> np.ndarray:
    """
    Encode a user's skills as a binary vector.
    Each position corresponds to a skill in the global skill list.
    """
    vector = np.zeros(len(all_skills))
    for skill in user_skills:
        if skill.skill_type == skill_type:
            name = skill.skill_name.lower()
            if name in all_skills:
                idx = all_skills.index(name)
                vector[idx] = 1.0
    return vector


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


def find_matches(
    current_user: User,
    db: Session,
    limit: int = 10
) -> List[Dict]:
    """
    Find the best skill barter matches for the current user.

    Matching algorithm:
    1. Build skill vectors for all users
    2. Score = 0.6 * skill_compatibility + 0.25 * reputation + 0.15 * availability
    3. Skill compatibility = cosine_sim(user.learn, other.teach) + cosine_sim(user.teach, other.learn)
    4. Sort by score descending

    Returns a list of match results with scores and matching skills.
    """
    all_skills = get_all_skill_names(db)
    if not all_skills:
        return []

    # Get current user's skill vectors
    user_teach = encode_skills(current_user.skills, all_skills, SkillType.TEACH)
    user_learn = encode_skills(current_user.skills, all_skills, SkillType.LEARN)

    # Get all other users with skills
    other_users = db.query(User).filter(
        User.id != current_user.id,
        User.is_banned == False
    ).all()

    results = []
    for other in other_users:
        if not other.skills:
            continue

        other_teach = encode_skills(other.skills, all_skills, SkillType.TEACH)
        other_learn = encode_skills(other.skills, all_skills, SkillType.LEARN)

        # Skill compatibility: what I want to learn matches what they teach, and vice versa
        learn_match = cosine_similarity(user_learn, other_teach)
        teach_match = cosine_similarity(user_teach, other_learn)
        skill_score = (learn_match + teach_match) / 2

        # Reputation normalized to 0-1 (score is 1-5)
        rep_score = other.reputation_score / 5.0

        # Availability overlap (simple check)
        avail_score = 0.5  # Default if no availability data
        if current_user.availability and other.availability:
            # Simple keyword overlap for availability
            user_avail = set(current_user.availability.lower().split(","))
            other_avail = set(other.availability.lower().split(","))
            overlap = len(user_avail & other_avail)
            total = max(len(user_avail | other_avail), 1)
            avail_score = overlap / total

        # Weighted composite score
        total_score = 0.6 * skill_score + 0.25 * rep_score + 0.15 * avail_score

        if total_score > 0.05:  # Only include meaningful matches
            # Find matching skill names
            matching = []
            they_teach = []
            they_learn = []

            for skill in other.skills:
                if skill.skill_type == SkillType.TEACH:
                    they_teach.append(skill.skill_name)
                    if skill.skill_name.lower() in [
                        s.skill_name.lower() for s in current_user.skills
                        if s.skill_type == SkillType.LEARN
                    ]:
                        matching.append(skill.skill_name)
                else:
                    they_learn.append(skill.skill_name)

            results.append({
                "user": other,
                "compatibility_score": round(total_score * 100, 1),
                "matching_skills": matching,
                "skills_they_teach": they_teach,
                "skills_they_learn": they_learn,
            })

    # Sort by compatibility score descending
    results.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return results[:limit]
