"""
Database seeder: populates the database with sample data for development.
Run with: python -m app.seed
"""
from .database import SessionLocal, engine, Base
from .models import User, Skill, SkillType, Session as SessionModel, SessionStatus, Transaction, TransactionType, Review, ReviewTargetType, Course, CourseLecture, VerificationStatus
from .auth import hash_password
from datetime import datetime, timedelta

# Drop and Re-create tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()
def seed():
    """Seed the database with sample users, skills, and sessions."""
    # No manual delete needed since drop_all handles it
    db.commit()

    # Create sample users
    users_data = [
        {
            "name": "Alice Johnson", "email": "alice@example.com",
            "bio": "Full-stack developer passionate about teaching Python and web development.",
            "location": "New York, USA", "availability": "weekdays,mornings,evenings",
            "skill_credits": 12.0, "reputation_score": 4.8, "is_admin": True,
            "is_premium_teacher": True, "verification_status": VerificationStatus.APPROVED,
        },
        {
            "name": "Bob Smith", "email": "bob@example.com",
            "bio": "UI/UX designer with 5 years of experience. Love creating beautiful interfaces.",
            "location": "San Francisco, USA", "availability": "weekdays,afternoons,evenings",
            "skill_credits": 8.0, "reputation_score": 4.5,
        },
        {
            "name": "Carol Williams", "email": "carol@example.com",
            "bio": "Professional photographer and video editor. Happy to share my knowledge!",
            "location": "London, UK", "availability": "weekends,mornings",
            "skill_credits": 15.0, "reputation_score": 4.9,
        },
        {
            "name": "David Lee", "email": "david@example.com",
            "bio": "Data scientist specializing in machine learning and AI.",
            "location": "Toronto, Canada", "availability": "weekdays,evenings",
            "skill_credits": 6.0, "reputation_score": 4.2,
        },
        {
            "name": "Eva Martinez", "email": "eva@example.com",
            "bio": "Marketing specialist and public speaking coach.",
            "location": "Madrid, Spain", "availability": "weekdays,mornings,afternoons",
            "skill_credits": 10.0, "reputation_score": 4.7,
        },
        {
            "name": "Frank Chen", "email": "frank@example.com",
            "bio": "Mobile app developer (React Native & Flutter). Guitar enthusiast.",
            "location": "Singapore", "availability": "weekdays,evenings,weekends",
            "skill_credits": 7.0, "reputation_score": 4.3,
        },
    ]

    users = []
    for data in users_data:
        user = User(
            name=data["name"], email=data["email"],
            password=hash_password("password123"),
            bio=data["bio"], location=data["location"],
            availability=data["availability"],
            skill_credits=data["skill_credits"],
            reputation_score=data["reputation_score"],
            is_admin=data.get("is_admin", False),
            is_premium_teacher=data.get("is_premium_teacher", False),
            verification_status=data.get("verification_status", VerificationStatus.NONE),
        )
        db.add(user)
        users.append(user)
    db.commit()

    # Create skills for each user
    skills_data = [
        # Alice - teaches Python, JavaScript; wants UI Design, Photography
        (users[0], "Python Programming", "teach", "expert"),
        (users[0], "JavaScript", "teach", "expert"),
        (users[0], "Web Development", "teach", "expert"),
        (users[0], "UI Design", "learn", "beginner"),
        (users[0], "Photography", "learn", "beginner"),
        # Bob - teaches UI Design, Figma; wants Python, Data Science
        (users[1], "UI Design", "teach", "expert"),
        (users[1], "Figma", "teach", "expert"),
        (users[1], "Graphic Design", "teach", "intermediate"),
        (users[1], "Python Programming", "learn", "beginner"),
        (users[1], "Data Science", "learn", "beginner"),
        # Carol - teaches Photography, Video Editing; wants Web Dev, Marketing
        (users[2], "Photography", "teach", "expert"),
        (users[2], "Video Editing", "teach", "expert"),
        (users[2], "Adobe Lightroom", "teach", "expert"),
        (users[2], "Web Development", "learn", "beginner"),
        (users[2], "Digital Marketing", "learn", "beginner"),
        # David - teaches Data Science, ML; wants Public Speaking, Guitar
        (users[3], "Data Science", "teach", "expert"),
        (users[3], "Machine Learning", "teach", "expert"),
        (users[3], "Python Programming", "teach", "intermediate"),
        (users[3], "Public Speaking", "learn", "beginner"),
        (users[3], "Guitar", "learn", "beginner"),
        # Eva - teaches Public Speaking, Marketing; wants Data Science, Python
        (users[4], "Public Speaking", "teach", "expert"),
        (users[4], "Digital Marketing", "teach", "expert"),
        (users[4], "Content Writing", "teach", "intermediate"),
        (users[4], "Data Science", "learn", "beginner"),
        (users[4], "Python Programming", "learn", "beginner"),
        # Frank - teaches React Native, Flutter, Guitar; wants ML, Photography
        (users[5], "React Native", "teach", "expert"),
        (users[5], "Flutter", "teach", "expert"),
        (users[5], "Guitar", "teach", "intermediate"),
        (users[5], "Machine Learning", "learn", "beginner"),
        (users[5], "Photography", "learn", "beginner"),
    ]

    for user, skill_name, skill_type, level in skills_data:
        db.add(Skill(
            user_id=user.id, skill_name=skill_name,
            skill_type=SkillType(skill_type), skill_level=level,
        ))
    db.commit()

    # Create sample sessions
    sessions_data = [
        (users[0], users[1], "Python Programming", "UI Design", 1.0, "completed"),
        (users[2], users[0], "Photography", "Web Development", 2.0, "completed"),
        (users[3], users[4], "Data Science", "Public Speaking", 1.0, "accepted"),
        (users[5], users[3], "Guitar", "Machine Learning", 1.0, "pending"),
    ]



    # Create Premium Course for Alice
    course = Course(
        teacher_id=users[0].id,
        title="Complete Python Masterclass",
        description="Learn Python from scratch to advanced concepts.",
        category="Programming",
        price=5.0,
        thumbnail_url="https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500&q=80",
        total_duration=2.5
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    
    db.add(CourseLecture(course_id=course.id, title="Introduction to Python", video_url="https://demo.com/vid1.mp4", duration=1.0, order_index=0))
    db.add(CourseLecture(course_id=course.id, title="Advanced Concepts", video_url="https://demo.com/vid2.mp4", duration=1.5, order_index=1))
    db.commit()

    # Create sample transactions for completed sessions
    db.add(Transaction(
        user_id=users[0].id, credits=1.0, type=TransactionType.EARNED,
        description="Taught Python Programming to Bob Smith"
    ))
    db.add(Transaction(
        user_id=users[1].id, credits=1.0, type=TransactionType.SPENT,
        description="Learned Python Programming from Alice Johnson"
    ))
    db.add(Transaction(
        user_id=users[2].id, credits=2.0, type=TransactionType.EARNED,
        description="Taught Photography to Alice Johnson"
    ))
    db.add(Transaction(
        user_id=users[0].id, credits=2.0, type=TransactionType.SPENT,
        description="Learned Photography from Carol Williams"
    ))
    db.commit()

    print("✅ Database seeded successfully!")
    print(f"   Created {len(users)} users")
    print(f"   Created {len(skills_data)} skills")
    print(f"   Created {len(sessions_data)} sessions")
    print("   Login with any user: email=alice@example.com, password=password123")

if __name__ == "__main__":
    seed()

db.close()
