"""
Database seeder: populates the database with sample data for development.
Run with: python manage.py seed
"""
from django.core.management.base import BaseCommand
from api.models import (
    User, Skill, Session, Transaction, Course, CourseLecture, Review,
)
from api.auth import hash_password


class Command(BaseCommand):
    help = "Seed the database with sample users, skills, sessions, and courses."

    def handle(self, *args, **options):
        # Clear existing data
        self.stdout.write("Clearing existing data...")
        for model in [Review, CourseLecture, Course, Transaction, Session, Skill, User]:
            model.objects.all().delete()

        # Create sample users
        users_data = [
            {"name": "Alice Johnson", "email": "alice@example.com",
             "bio": "Full-stack developer passionate about teaching Python and web development.",
             "location": "New York, USA", "availability": "weekdays,mornings,evenings",
             "skill_credits": 12.0, "reputation_score": 4.8, "is_admin": True,
             "is_premium_teacher": True, "verification_status": "approved"},
            {"name": "Bob Smith", "email": "bob@example.com",
             "bio": "UI/UX designer with 5 years of experience. Love creating beautiful interfaces.",
             "location": "San Francisco, USA", "availability": "weekdays,afternoons,evenings",
             "skill_credits": 8.0, "reputation_score": 4.5},
            {"name": "Carol Williams", "email": "carol@example.com",
             "bio": "Professional photographer and video editor. Happy to share my knowledge!",
             "location": "London, UK", "availability": "weekends,mornings",
             "skill_credits": 15.0, "reputation_score": 4.9},
            {"name": "David Lee", "email": "david@example.com",
             "bio": "Data scientist specializing in machine learning and AI.",
             "location": "Toronto, Canada", "availability": "weekdays,evenings",
             "skill_credits": 6.0, "reputation_score": 4.2},
            {"name": "Eva Martinez", "email": "eva@example.com",
             "bio": "Marketing specialist and public speaking coach.",
             "location": "Madrid, Spain", "availability": "weekdays,mornings,afternoons",
             "skill_credits": 10.0, "reputation_score": 4.7},
            {"name": "Frank Chen", "email": "frank@example.com",
             "bio": "Mobile app developer (React Native & Flutter). Guitar enthusiast.",
             "location": "Singapore", "availability": "weekdays,evenings,weekends",
             "skill_credits": 7.0, "reputation_score": 4.3},
        ]

        users = []
        for data in users_data:
            user = User.objects.create(
                name=data["name"], email=data["email"],
                password=hash_password("password123"),
                bio=data["bio"], location=data["location"],
                availability=data["availability"],
                skill_credits=data["skill_credits"],
                reputation_score=data["reputation_score"],
                is_admin=data.get("is_admin", False),
                is_premium_teacher=data.get("is_premium_teacher", False),
                verification_status=data.get("verification_status", "none"),
            )
            users.append(user)

        # Create skills
        skills_data = [
            (users[0], "Python Programming", "teach", "expert"),
            (users[0], "JavaScript", "teach", "expert"),
            (users[0], "Web Development", "teach", "expert"),
            (users[0], "UI Design", "learn", "beginner"),
            (users[0], "Photography", "learn", "beginner"),
            (users[1], "UI Design", "teach", "expert"),
            (users[1], "Figma", "teach", "expert"),
            (users[1], "Graphic Design", "teach", "intermediate"),
            (users[1], "Python Programming", "learn", "beginner"),
            (users[1], "Data Science", "learn", "beginner"),
            (users[2], "Photography", "teach", "expert"),
            (users[2], "Video Editing", "teach", "expert"),
            (users[2], "Adobe Lightroom", "teach", "expert"),
            (users[2], "Web Development", "learn", "beginner"),
            (users[2], "Digital Marketing", "learn", "beginner"),
            (users[3], "Data Science", "teach", "expert"),
            (users[3], "Machine Learning", "teach", "expert"),
            (users[3], "Python Programming", "teach", "intermediate"),
            (users[3], "Public Speaking", "learn", "beginner"),
            (users[3], "Guitar", "learn", "beginner"),
            (users[4], "Public Speaking", "teach", "expert"),
            (users[4], "Digital Marketing", "teach", "expert"),
            (users[4], "Content Writing", "teach", "intermediate"),
            (users[4], "Data Science", "learn", "beginner"),
            (users[4], "Python Programming", "learn", "beginner"),
            (users[5], "React Native", "teach", "expert"),
            (users[5], "Flutter", "teach", "expert"),
            (users[5], "Guitar", "teach", "intermediate"),
            (users[5], "Machine Learning", "learn", "beginner"),
            (users[5], "Photography", "learn", "beginner"),
        ]

        for user, skill_name, skill_type, level in skills_data:
            Skill.objects.create(user=user, skill_name=skill_name, skill_type=skill_type, skill_level=level)

        # Create Premium Course for Alice
        course = Course.objects.create(
            teacher=users[0], title="Complete Python Masterclass",
            description="Learn Python from scratch to advanced concepts.",
            category="Programming", price=5.0,
            thumbnail_url="https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500&q=80",
            total_duration=2.5,
        )
        CourseLecture.objects.create(course=course, title="Introduction to Python",
            video_url="https://demo.com/vid1.mp4", duration=1.0, order_index=0)
        CourseLecture.objects.create(course=course, title="Advanced Concepts",
            video_url="https://demo.com/vid2.mp4", duration=1.5, order_index=1)

        # Create sample transactions
        Transaction.objects.create(user=users[0], credits=1.0, type="earned",
            description="Taught Python Programming to Bob Smith")
        Transaction.objects.create(user=users[1], credits=1.0, type="spent",
            description="Learned Python Programming from Alice Johnson")
        Transaction.objects.create(user=users[2], credits=2.0, type="earned",
            description="Taught Photography to Alice Johnson")
        Transaction.objects.create(user=users[0], credits=2.0, type="spent",
            description="Learned Photography from Carol Williams")

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
        self.stdout.write(f"   Created {len(users)} users")
        self.stdout.write(f"   Created {len(skills_data)} skills")
        self.stdout.write("   Login with: email=alice@example.com, password=password123")
