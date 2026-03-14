"""
Pydantic schemas for request/response validation across all API endpoints.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# --- Auth Schemas ---

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6)
    bio: Optional[str] = ""
    location: Optional[str] = ""
    availability: Optional[str] = ""


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- User Schemas ---

class UserProfile(BaseModel):
    id: int
    name: str
    email: str
    bio: str
    location: str
    availability: str
    skill_credits: float
    reputation_score: float
    is_admin: bool
    is_premium_teacher: bool
    verification_status: str
    created_at: datetime
    skills: List["SkillResponse"] = []

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    availability: Optional[str] = None


class UserBrief(BaseModel):
    id: int
    name: str
    location: str
    reputation_score: float
    skill_credits: float
    is_premium_teacher: bool

    class Config:
        from_attributes = True


# --- Premium Teacher Schemas ---

class PremiumRequestCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    expertise_area: str = Field(..., min_length=2, max_length=200)
    years_of_experience: int = Field(..., ge=0, le=50)
    bio: str = Field(..., min_length=10, max_length=1000)
    document_url: str = Field(..., min_length=5)


class PremiumRequestResponse(BaseModel):
    id: int
    user_id: int
    document_url: str
    status: str
    submitted_at: datetime
    resolved_at: Optional[datetime] = None
    user: Optional[UserBrief] = None

    class Config:
        from_attributes = True


# --- Skill Schemas ---

class SkillCreate(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=200)
    skill_type: str = Field(..., pattern="^(teach|learn)$")
    skill_level: Optional[str] = "intermediate"
    description: Optional[str] = ""


class SkillResponse(BaseModel):
    id: int
    user_id: int
    skill_name: str
    skill_type: str
    skill_level: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class SkillBrowse(BaseModel):
    id: int
    skill_name: str
    skill_type: str
    skill_level: str
    description: str
    user: UserBrief

    class Config:
        from_attributes = True


# --- Session Schemas ---

class SessionRequest(BaseModel):
    teacher_id: int
    skill_offered: str
    skill_requested: str
    duration: Optional[float] = 1.0
    preferred_time: Optional[str] = ""


class SessionResponse(BaseModel):
    id: int
    teacher_id: int
    learner_id: int
    skill_offered: str
    skill_requested: str
    duration: float
    status: str
    preferred_time: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    teacher: Optional[UserBrief] = None
    learner: Optional[UserBrief] = None

    class Config:
        from_attributes = True


# --- Review Schemas ---

class ReviewCreate(BaseModel):
    rating: float = Field(..., ge=1, le=5)
    content: Optional[str] = ""
    target_type: str = Field(..., pattern="^(SESSION|COURSE)$")
    target_id: int
    target_user_id: Optional[int] = None


class ReviewResponse(BaseModel):
    id: int
    author_id: int
    target_type: str
    target_id: int
    target_user_id: Optional[int]
    rating: float
    content: str
    created_at: datetime
    author: Optional[UserBrief] = None

    class Config:
        from_attributes = True


# --- Course Schemas ---

class CourseLectureCreate(BaseModel):
    title: str = Field(..., min_length=2)
    video_url: str = Field(..., min_length=5)
    duration: Optional[float] = 0.0


class CourseLectureResponse(BaseModel):
    id: int
    course_id: int
    title: str
    video_url: str
    duration: float
    order_index: int

    class Config:
        from_attributes = True


class CourseCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: Optional[str] = ""
    category: str = Field(..., min_length=2)
    price: float = Field(..., ge=0)
    thumbnail_url: Optional[str] = None
    lectures: List[CourseLectureCreate] = []


class CourseResponse(BaseModel):
    id: int
    teacher_id: int
    title: str
    description: str
    category: str
    price: float
    thumbnail_url: Optional[str]
    total_duration: float
    created_at: datetime
    teacher: Optional[UserBrief] = None
    lectures: List[CourseLectureResponse] = []

    class Config:
        from_attributes = True


class CourseEnrollmentResponse(BaseModel):
    id: int
    user_id: int
    course_id: int
    purchase_price: float
    purchased_at: datetime
    course: Optional[CourseResponse] = None

    class Config:
        from_attributes = True


# --- Wallet/Transaction Schemas ---



class WalletResponse(BaseModel):
    skill_credits: float
    total_earned: float
    total_spent: float
    last_weekly_credits_at: Optional[datetime] = None
    next_weekly_credits_in_days: Optional[int] = None


class TransactionResponse(BaseModel):
    id: int
    credits: float
    type: str
    description: str
    session_id: Optional[int]
    course_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Matching Schemas ---

class MatchResult(BaseModel):
    user: UserBrief
    compatibility_score: float
    matching_skills: List[str]
    skills_they_teach: List[str]
    skills_they_learn: List[str]


# --- Admin Schemas ---

class AdminUserResponse(BaseModel):
    id: int
    name: str
    email: str
    bio: str
    location: str
    skill_credits: float
    reputation_score: float
    is_admin: bool
    is_premium_teacher: bool
    verification_status: str
    is_banned: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Chat Schemas ---

class ChatMessageCreate(BaseModel):
    session_id: int
    sender_id: int
    message: str


class ChatMessageResponse(BaseModel):
    id: Optional[int] = None
    session_id: int
    sender_id: int
    message: str
    timestamp: str

    class Config:
        from_attributes = True
