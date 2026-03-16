"""
Course router: premium courses creation, browsing, purchasing, and viewing.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from ..models import User, Course, CourseLecture, CourseEnrollment, Transaction, TransactionType, Review, ReviewTargetType
from ..schemas import CourseCreate, CourseResponse, CourseEnrollmentResponse, ReviewCreate
from ..auth import get_current_user

router = APIRouter(prefix="/api/courses", tags=["Courses"])

@router.get("/", response_model=List[CourseResponse])
def get_all_courses(db: Session = Depends(get_db)):
    """Publicly browse all premium courses."""
    courses = db.query(Course).options(
        joinedload(Course.teacher),
        joinedload(Course.lectures)
    ).order_by(Course.created_at.desc()).all()
    
    # Hide video URLs for public browsing
    for course in courses:
        for lecture in course.lectures:
            lecture.video_url = "hidden_until_purchased"
            
    return courses


@router.get("/enrolled", response_model=List[CourseEnrollmentResponse])
def get_enrolled_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get courses the current user has purchased/enrolled in."""
    enrollments = db.query(CourseEnrollment).options(
        joinedload(CourseEnrollment.course).joinedload(Course.teacher),
        joinedload(CourseEnrollment.course).joinedload(Course.lectures),
    ).filter(
        CourseEnrollment.user_id == current_user.id
    ).order_by(CourseEnrollment.purchased_at.desc()).all()
    return enrollments


@router.post("/", response_model=CourseResponse)
def create_course(
    req: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a premium course.
    Only approved Premium Teachers can do this.
    """
    if not current_user.is_premium_teacher:
        raise HTTPException(status_code=403, detail="Only approved Premium Teachers can create courses")

    new_course = Course(
        teacher_id=current_user.id,
        title=req.title,
        description=req.description,
        category=req.category,
        price=req.price,
        thumbnail_url=req.thumbnail_url,
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    # Add lectures
    total_duration = 0.0
    for i, lec in enumerate(req.lectures):
        db_lec = CourseLecture(
            course_id=new_course.id,
            title=lec.title,
            video_url=lec.video_url,
            duration=lec.duration,
            order_index=i
        )
        db.add(db_lec)
        total_duration += lec.duration
        
    new_course.total_duration = total_duration
    db.commit()
    db.refresh(new_course)
    
    return new_course


@router.get("/{course_id}", response_model=CourseResponse)
def get_course_detail(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get course details.
    Reveals video URLs ONLY IF the user is the teacher or is enrolled.
    """
    course = db.query(Course).options(
        joinedload(Course.teacher),
        joinedload(Course.lectures)
    ).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    is_teacher = (course.teacher_id == current_user.id)
    is_enrolled = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == course_id,
        CourseEnrollment.user_id == current_user.id
    ).first() is not None
    
    if not (is_teacher or is_enrolled):
        for lecture in course.lectures:
            lecture.video_url = "hidden_until_purchased"
            
    return course


@router.post("/{course_id}/purchase", response_model=CourseEnrollmentResponse)
def purchase_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Purchase a course using Skill Credits.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.teacher_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot buy your own course")
        
    # Check if already enrolled
    existing = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == course_id,
        CourseEnrollment.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You are already enrolled in this course")
        
    # Debit from buyer
    if current_user.skill_credits < course.price:
        raise HTTPException(status_code=400, detail="Not enough skill credits to purchase this course")
        
    current_user.skill_credits -= course.price
    
    # Credit to teacher
    teacher = db.query(User).filter(User.id == course.teacher_id).first()
    if teacher:
        teacher.skill_credits += course.price
        
        # Transaction for earning
        db.add(Transaction(
            user_id=teacher.id,
            credits=course.price,
            type=TransactionType.EARNED,
            description=f"Course '{course.title}' purchased by {current_user.name}",
            course_id=course.id
        ))
        
    # Transaction for spending
    db.add(Transaction(
        user_id=current_user.id,
        credits=course.price,
        type=TransactionType.SPENT,
        description=f"Purchased course '{course.title}'",
        course_id=course.id
    ))
    
    enrollment = CourseEnrollment(
        user_id=current_user.id,
        course_id=course.id,
        purchase_price=course.price
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    
    return enrollment


@router.post("/{course_id}/rate")
def rate_course(
    course_id: int,
    rating: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate a purchased course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    is_enrolled = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == course_id,
        CourseEnrollment.user_id == current_user.id
    ).first()
    if not is_enrolled:
        raise HTTPException(status_code=403, detail="You must purchase the course before rating it")
        
    existing = db.query(Review).filter(
        Review.author_id == current_user.id,
        Review.target_id == course_id,
        Review.target_type == ReviewTargetType.COURSE
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already rated this course")
        
    new_review = Review(
        author_id=current_user.id,
        target_type=ReviewTargetType.COURSE,
        target_id=course.id,
        target_user_id=course.teacher_id,
        rating=rating.rating,
        content=rating.content
    )
    db.add(new_review)
    db.commit()
    
    from .session_router import _update_reputation
    _update_reputation(db, course.teacher_id)
    
    return {"message": "Course rated successfully", "rating": rating.rating}
