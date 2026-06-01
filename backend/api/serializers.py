"""
Django REST Framework serializers for request/response validation across all API endpoints.
Replaces the Pydantic schemas from the FastAPI version.
"""
from rest_framework import serializers
from .models import (
    User, Skill, Session, Transaction, Course, CourseLecture,
    CourseEnrollment, Review, ChatMessage, PremiumTeacherRequest,
)


# --- Auth Serializers ---

class UserRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=2, max_length=100)
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(min_length=6, write_only=True)
    bio = serializers.CharField(required=False, default="", allow_blank=True)
    location = serializers.CharField(required=False, default="", allow_blank=True)
    availability = serializers.CharField(required=False, default="", allow_blank=True)


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class TokenSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    token_type = serializers.CharField(default="bearer")


# --- User Serializers ---

class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "location", "reputation_score", "skill_credits", "is_premium_teacher"]


class UserUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_null=True)
    bio = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    location = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    availability = serializers.CharField(required=False, allow_null=True, allow_blank=True)


# --- Skill Serializers ---

class SkillCreateSerializer(serializers.Serializer):
    skill_name = serializers.CharField(min_length=1, max_length=200)
    skill_type = serializers.ChoiceField(choices=["teach", "learn"])
    skill_level = serializers.CharField(required=False, default="intermediate")
    description = serializers.CharField(required=False, default="", allow_blank=True)


class SkillResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "user_id", "skill_name", "skill_type", "skill_level", "description", "created_at"]


class SkillBrowseSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer()

    class Meta:
        model = Skill
        fields = ["id", "skill_name", "skill_type", "skill_level", "description", "user"]


# --- User Profile (with skills) ---

class UserProfileSerializer(serializers.ModelSerializer):
    skills = SkillResponseSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "name", "email", "bio", "location", "availability",
            "skill_credits", "reputation_score", "is_admin",
            "is_premium_teacher", "verification_status", "created_at", "skills",
        ]


# --- Premium Teacher Serializers ---

class PremiumRequestCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(min_length=2, max_length=100)
    expertise_area = serializers.CharField(min_length=2, max_length=200)
    years_of_experience = serializers.IntegerField(min_value=0, max_value=50)
    bio = serializers.CharField(min_length=10, max_length=1000)
    document_url = serializers.CharField(min_length=5)


class PremiumRequestResponseSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)

    class Meta:
        model = PremiumTeacherRequest
        fields = ["id", "user_id", "document_url", "status", "submitted_at", "resolved_at", "user"]


# --- Session Serializers ---

class SessionRequestSerializer(serializers.Serializer):
    teacher_id = serializers.IntegerField()
    skill_offered = serializers.CharField()
    skill_requested = serializers.CharField()
    duration = serializers.FloatField(required=False, default=1.0)
    preferred_time = serializers.CharField(required=False, default="", allow_blank=True)


class SessionResponseSerializer(serializers.ModelSerializer):
    teacher = UserBriefSerializer(read_only=True)
    learner = UserBriefSerializer(read_only=True)

    class Meta:
        model = Session
        fields = [
            "id", "teacher_id", "learner_id", "skill_offered", "skill_requested",
            "duration", "status", "preferred_time", "created_at", "completed_at",
            "teacher", "learner",
        ]


# --- Review Serializers ---

class ReviewCreateSerializer(serializers.Serializer):
    rating = serializers.FloatField(min_value=1, max_value=5)
    content = serializers.CharField(required=False, default="", allow_blank=True)
    target_type = serializers.ChoiceField(choices=["SESSION", "COURSE"])
    target_id = serializers.IntegerField()
    target_user_id = serializers.IntegerField(required=False, allow_null=True)


class ReviewResponseSerializer(serializers.ModelSerializer):
    author = UserBriefSerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "author_id", "target_type", "target_id",
            "target_user_id", "rating", "content", "created_at", "author",
        ]


# --- Course Serializers ---

class CourseLectureCreateSerializer(serializers.Serializer):
    title = serializers.CharField(min_length=2)
    video_url = serializers.CharField(min_length=5)
    duration = serializers.FloatField(required=False, default=0.0)


class CourseLectureResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseLecture
        fields = ["id", "course_id", "title", "video_url", "duration", "order_index"]


class CourseCreateSerializer(serializers.Serializer):
    title = serializers.CharField(min_length=5, max_length=200)
    description = serializers.CharField(required=False, default="", allow_blank=True)
    category = serializers.CharField(min_length=2)
    price = serializers.FloatField(min_value=0)
    thumbnail_url = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    lectures = CourseLectureCreateSerializer(many=True, required=False, default=[])


class CourseResponseSerializer(serializers.ModelSerializer):
    teacher = UserBriefSerializer(read_only=True)
    lectures = CourseLectureResponseSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            "id", "teacher_id", "title", "description", "category",
            "price", "thumbnail_url", "total_duration", "created_at",
            "teacher", "lectures",
        ]


class CourseEnrollmentResponseSerializer(serializers.ModelSerializer):
    course = CourseResponseSerializer(read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = ["id", "user_id", "course_id", "purchase_price", "purchased_at", "course"]


# --- Wallet/Transaction Serializers ---

class BuyCreditsSerializer(serializers.Serializer):
    amount = serializers.FloatField(min_value=1.0)
    payment_method = serializers.CharField(max_length=50, required=False, default="Credit Card")


class WalletResponseSerializer(serializers.Serializer):
    skill_credits = serializers.FloatField()
    total_earned = serializers.FloatField()
    total_spent = serializers.FloatField()
    last_weekly_credits_at = serializers.DateTimeField(allow_null=True)
    next_weekly_credits_in_days = serializers.IntegerField(allow_null=True)


class TransactionResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ["id", "credits", "type", "description", "session_id", "course_id", "created_at"]


# --- Matching Serializers ---

class MatchResultSerializer(serializers.Serializer):
    user = UserBriefSerializer()
    compatibility_score = serializers.FloatField()
    matching_skills = serializers.ListField(child=serializers.CharField())
    skills_they_teach = serializers.ListField(child=serializers.CharField())
    skills_they_learn = serializers.ListField(child=serializers.CharField())


# --- Admin Serializers ---

class AdminUserResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "name", "email", "bio", "location", "skill_credits",
            "reputation_score", "is_admin", "is_premium_teacher",
            "verification_status", "is_banned", "created_at",
        ]


# --- Chat Serializers ---

class ChatMessageCreateSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    sender_id = serializers.IntegerField()
    message = serializers.CharField()


class ChatMessageResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField(allow_null=True, required=False)
    session_id = serializers.IntegerField()
    sender_id = serializers.IntegerField()
    message = serializers.CharField()
    timestamp = serializers.CharField()
