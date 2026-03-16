"""
SQLAlchemy ORM models for the SkillSwap platform.
Defines Users, Skills, Sessions, Transactions, Ratings, Courses, and more.
"""
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum, Boolean
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .database import Base


# --- Enums ---

class SkillType(str, enum.Enum):
    """Whether a skill is offered for teaching or requested for learning."""
    TEACH = "teach"
    LEARN = "learn"


class SessionStatus(str, enum.Enum):
    """Lifecycle status of a skill exchange session."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class TransactionType(str, enum.Enum):
    """Type of credit transaction."""
    EARNED = "earned"
    SPENT = "spent"
    ALLOCATED = "allocated" # For the 5 weekly free credits


class VerificationStatus(str, enum.Enum):
    """Verification status for premium teachers."""
    NONE = "none"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ReviewTargetType(str, enum.Enum):
    """Target type for a generalized review."""
    SESSION = "session"
    COURSE = "course"


# --- Models ---

class User(Base):
    """
    User model storing profile info, credentials, skill economy data, and premium status.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)  # Hashed password
    bio = Column(Text, default="")
    location = Column(String(200), default="")
    availability = Column(String(500), default="")  # JSON string of available hours
    skill_credits = Column(Float, default=5.0)  # Start with 5 free credits
    reputation_score = Column(Float, default=5.0)  # Scale 1-5, default 5
    is_admin = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    
    # Premium Teacher fields
    is_premium_teacher = Column(Boolean, default=False)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.NONE)
    license_document = Column(String(500), nullable=True) # URL or path
    
    # Weekly Credit Tracking
    last_weekly_credits_at = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    skills = relationship("Skill", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    taught_sessions = relationship("Session", foreign_keys="Session.teacher_id", back_populates="teacher")
    learned_sessions = relationship("Session", foreign_keys="Session.learner_id", back_populates="learner")
    t_requests = relationship("PremiumTeacherRequest", back_populates="user", cascade="all, delete-orphan")
    courses = relationship("Course", back_populates="teacher", cascade="all, delete-orphan")
    enrollments = relationship("CourseEnrollment", back_populates="user", cascade="all, delete-orphan")
    reviews_written = relationship("Review", foreign_keys="Review.author_id", back_populates="author")
    reviews_received = relationship("Review", foreign_keys="Review.target_user_id", back_populates="target_user")
    messages_sent = relationship("ChatMessage", back_populates="sender", cascade="all, delete-orphan")


class PremiumTeacherRequest(Base):
    """
    Tracks application requests from users wanting to become Premium Teachers.
    """
    __tablename__ = "premium_teacher_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_url = Column(String(500), nullable=False)
    status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="t_requests")
class Skill(Base):
    """
    A skill entry linked to a user. Can be either a skill they teach or want to learn.
    """
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_name = Column(String(200), nullable=False, index=True)
    skill_type = Column(Enum(SkillType), nullable=False)  # teach or learn
    skill_level = Column(String(50), default="intermediate")  # beginner, intermediate, expert
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="skills")


class Session(Base):
    """
    A skill exchange session between a teacher and a learner.
    """
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    learner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_offered = Column(String(200), nullable=False)
    skill_requested = Column(String(200), nullable=False)
    duration = Column(Float, default=1.0)  # In hours
    status = Column(Enum(SessionStatus), default=SessionStatus.PENDING)
    preferred_time = Column(String(200), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="taught_sessions")
    learner = relationship("User", foreign_keys=[learner_id], back_populates="learned_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class Transaction(Base):
    """
    Tracks skill credit movements. Teaching earns credits, learning spends them.
    Weekly allocations also recorded here.
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    credits = Column(Float, nullable=False)
    type = Column(Enum(TransactionType), nullable=False)  # earned, spent, allocated
    description = Column(String(500), default="")
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True) # Optional link
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True) # Optional link
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="transactions")
    # For reporting purposes, course & session relationships could be added but IDs suffice for now.


class Course(Base):
    """
    Premium courses created by approved Premium Teachers.
    """
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, default="")
    category = Column(String(100), nullable=False)
    price = Column(Float, nullable=False, default=0.0) # Cost in Skill Credits
    thumbnail_url = Column(String(500), nullable=True)
    total_duration = Column(Float, default=0.0) # In hours
    created_at = Column(DateTime, default=datetime.utcnow)
    
    teacher = relationship("User", back_populates="courses")
    lectures = relationship("CourseLecture", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")


class CourseLecture(Base):
    """
    Individual video lectures within a Course.
    """
    __tablename__ = "course_lectures"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(200), nullable=False)
    video_url = Column(String(500), nullable=False)
    duration = Column(Float, default=0.0) # In mins/hours
    order_index = Column(Integer, default=0) # To order lectures
    created_at = Column(DateTime, default=datetime.utcnow)
    
    course = relationship("Course", back_populates="lectures")


class CourseEnrollment(Base):
    """
    Tracks which users have purchased/enrolled in which courses.
    """
    __tablename__ = "course_enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    purchase_price = Column(Float, nullable=False)
    purchased_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class Review(Base):
    """
    Unified review table for both Sessions and Courses.
    """
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type = Column(Enum(ReviewTargetType), nullable=False) # SESSION or COURSE
    target_id = Column(Integer, nullable=False) # ID of session or course
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Teacher/Learner being reviewed
    
    rating = Column(Float, nullable=False) # 1 to 5
    content = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    author = relationship("User", foreign_keys=[author_id], back_populates="reviews_written")
    target_user = relationship("User", foreign_keys=[target_user_id], back_populates="reviews_received")


class ChatMessage(Base):
    """
    Persistent chat history for WebSocket communication in a session.
    """
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("Session", back_populates="messages")
    sender = relationship("User", back_populates="messages_sent")
