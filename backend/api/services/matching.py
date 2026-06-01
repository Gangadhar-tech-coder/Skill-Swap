"""
AI Skill Matching service.
Uses cosine similarity to find the best skill barter partners based on
skill compatibility, reputation, and availability overlap.

Adapted from the FastAPI version to use Django ORM instead of SQLAlchemy.
"""
import numpy as np
from typing import List, Dict

from ..models import User, Skill


def get_all_skill_names() -> List[str]:
    """Get a sorted list of all unique skill names in the system."""
    skills = Skill.objects.values_list("skill_name", flat=True).distinct()
    return sorted(set(s.lower() for s in skills))


def encode_skills(user_skills, all_skills: List[str], skill_type: str) -> np.ndarray:
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


def find_matches(current_user: User, limit: int = 10) -> List[Dict]:
    """
    Find the best skill barter matches for the current user.

    Matching algorithm:
    1. Build skill vectors for all users
    2. Score = 0.6 * skill_compatibility + 0.25 * reputation + 0.15 * availability
    3. Skill compatibility = cosine_sim(user.learn, other.teach) + cosine_sim(user.teach, other.learn)
    4. Sort by score descending
    """
    all_skills = get_all_skill_names()
    if not all_skills:
        return []

    # Get current user's skills
    user_skills = list(current_user.skills.all())
    user_teach = encode_skills(user_skills, all_skills, "teach")
    user_learn = encode_skills(user_skills, all_skills, "learn")

    # Get all other users with skills
    other_users = User.objects.prefetch_related("skills").filter(
        is_banned=False
    ).exclude(id=current_user.id)

    results = []
    for other in other_users:
        other_skills = list(other.skills.all())
        if not other_skills:
            continue

        other_teach = encode_skills(other_skills, all_skills, "teach")
        other_learn = encode_skills(other_skills, all_skills, "learn")

        # Skill compatibility
        learn_match = cosine_similarity(user_learn, other_teach)
        teach_match = cosine_similarity(user_teach, other_learn)
        skill_score = (learn_match + teach_match) / 2

        # Reputation normalized to 0-1 (score is 1-5)
        rep_score = other.reputation_score / 5.0

        # Availability overlap
        avail_score = 0.5
        if current_user.availability and other.availability:
            user_avail = set(current_user.availability.lower().split(","))
            other_avail = set(other.availability.lower().split(","))
            overlap = len(user_avail & other_avail)
            total = max(len(user_avail | other_avail), 1)
            avail_score = overlap / total

        # Weighted composite score
        total_score = 0.6 * skill_score + 0.25 * rep_score + 0.15 * avail_score

        if total_score > 0.05:
            matching = []
            they_teach = []
            they_learn = []

            user_learn_names = [s.skill_name.lower() for s in user_skills if s.skill_type == "learn"]

            for skill in other_skills:
                if skill.skill_type == "teach":
                    they_teach.append(skill.skill_name)
                    if skill.skill_name.lower() in user_learn_names:
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

    results.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return results[:limit]
