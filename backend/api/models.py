"""
Django ORM models for the SkillSwap platform.
Defines Users, Skills, Sessions, Transactions, Ratings, Courses, and more.
"""
from django.db import models
from datetime import datetime


# --- Models ---

class User(models.Model):
    """
    User model storing profile info, credentials, skill economy data, and premium status.
    """
    VERIFICATION_CHOICES = [
        ("none", "None"),
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=255, unique=True, db_index=True)
    password = models.CharField(max_length=255)  # Hashed password
    bio = models.TextField(default="", blank=True)
    location = models.CharField(max_length=200, default="", blank=True)
    availability = models.CharField(max_length=500, default="", blank=True)  # JSON string of available hours
    skill_credits = models.FloatField(default=5.0)  # Start with 5 free credits
    reputation_score = models.FloatField(default=5.0)  # Scale 1-5, default 5
    is_admin = models.BooleanField(default=False)
    is_banned = models.BooleanField(default=False)

    # Premium Teacher fields
    is_premium_teacher = models.BooleanField(default=False)
    verification_status = models.CharField(
        max_length=20, choices=VERIFICATION_CHOICES, default="none"
    )
    license_document = models.CharField(max_length=500, null=True, blank=True)  # URL or path

    # Weekly Credit Tracking
    last_weekly_credits_at = models.DateTimeField(default=datetime.utcnow)

    created_at = models.DateTimeField(default=datetime.utcnow)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"

    def __str__(self):
        return f"{self.name} ({self.email})"


class PremiumTeacherRequest(models.Model):
    """
    Tracks application requests from users wanting to become Premium Teachers.
    """
    VERIFICATION_CHOICES = [
        ("none", "None"),
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="t_requests")
    document_url = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default="pending")
    submitted_at = models.DateTimeField(default=datetime.utcnow)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "premium_teacher_requests"

    def __str__(self):
        return f"PremiumRequest #{self.id} by {self.user.name}"


class Skill(models.Model):
    """
    A skill entry linked to a user. Can be either a skill they teach or want to learn.
    """
    SKILL_TYPE_CHOICES = [
        ("teach", "Teach"),
        ("learn", "Learn"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="skills")
    skill_name = models.CharField(max_length=200, db_index=True)
    skill_type = models.CharField(max_length=10, choices=SKILL_TYPE_CHOICES)  # teach or learn
    skill_level = models.CharField(max_length=50, default="intermediate")  # beginner, intermediate, expert
    description = models.TextField(default="", blank=True)
    created_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = "skills"

    def __str__(self):
        return f"{self.skill_name} ({self.skill_type}) - {self.user.name}"


class Session(models.Model):
    """
    A skill exchange session between a teacher and a learner.
    """
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("rejected", "Rejected"),
    ]

    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name="taught_sessions")
    learner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="learned_sessions")
    skill_offered = models.CharField(max_length=200)
    skill_requested = models.CharField(max_length=200)
    duration = models.FloatField(default=1.0)  # In hours
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    preferred_time = models.CharField(max_length=200, default="", blank=True)
    created_at = models.DateTimeField(default=datetime.utcnow)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "sessions"

    def __str__(self):
        return f"Session #{self.id}: {self.teacher.name} -> {self.learner.name}"


class Transaction(models.Model):
    """
    Tracks skill credit movements. Teaching earns credits, learning spends them.
    Weekly allocations also recorded here.
    """
    TRANSACTION_TYPE_CHOICES = [
        ("earned", "Earned"),
        ("spent", "Spent"),
        ("allocated", "Allocated"),
        ("purchased", "Purchased"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    credits = models.FloatField()
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)  # earned, spent, allocated
    description = models.CharField(max_length=500, default="", blank=True)
    session_id = models.IntegerField(null=True, blank=True)  # Optional link
    course_id = models.IntegerField(null=True, blank=True)  # Optional link
    created_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = "transactions"

    def __str__(self):
        return f"Transaction #{self.id}: {self.type} {self.credits} credits"


class Course(models.Model):
    """
    Premium courses created by approved Premium Teachers.
    """
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name="courses")
    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField(default="", blank=True)
    category = models.CharField(max_length=100)
    price = models.FloatField(default=0.0)  # Cost in Skill Credits
    thumbnail_url = models.CharField(max_length=500, null=True, blank=True)
    total_duration = models.FloatField(default=0.0)  # In hours
    created_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = "courses"

    def __str__(self):
        return f"{self.title} by {self.teacher.name}"


class CourseLecture(models.Model):
    """
    Individual video lectures within a Course.
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lectures")
    title = models.CharField(max_length=200)
    video_url = models.CharField(max_length=500)
    duration = models.FloatField(default=0.0)  # In mins/hours
    order_index = models.IntegerField(default=0)  # To order lectures
    created_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = "course_lectures"

    def __str__(self):
        return f"Lecture: {self.title}"


class CourseEnrollment(models.Model):
    """
    Tracks which users have purchased/enrolled in which courses.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    purchase_price = models.FloatField()
    purchased_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = "course_enrollments"

    def __str__(self):
        return f"{self.user.name} enrolled in {self.course.title}"


class Review(models.Model):
    """
    Unified review table for both Sessions and Courses.
    """
    TARGET_TYPE_CHOICES = [
        ("session", "Session"),
        ("course", "Course"),
    ]

    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews_written")
    target_type = models.CharField(max_length=10, choices=TARGET_TYPE_CHOICES)  # SESSION or COURSE
    target_id = models.IntegerField()  # ID of session or course
    target_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews_received"
    )  # Teacher/Learner being reviewed

    rating = models.FloatField()  # 1 to 5
    content = models.TextField(default="", blank=True)
    created_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = "reviews"

    def __str__(self):
        return f"Review #{self.id} by {self.author.name}"


class ChatMessage(models.Model):
    """
    Persistent chat history for WebSocket communication in a session.
    """
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages_sent")
    message = models.TextField()
    timestamp = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = "chat_messages"

    def __str__(self):
        return f"Message #{self.id} in Session #{self.session_id}"
