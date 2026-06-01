"""
Register all models with Django Admin for management.
"""
from django.contrib import admin
from .models import (
    User, Skill, Session, Transaction, Course, CourseLecture,
    CourseEnrollment, Review, ChatMessage, PremiumTeacherRequest,
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "email", "skill_credits", "reputation_score", "is_admin", "is_banned"]
    search_fields = ["name", "email"]
    list_filter = ["is_admin", "is_banned", "is_premium_teacher"]


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ["id", "skill_name", "skill_type", "skill_level", "user"]
    list_filter = ["skill_type", "skill_level"]


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ["id", "teacher", "learner", "skill_offered", "status", "created_at"]
    list_filter = ["status"]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "credits", "type", "created_at"]
    list_filter = ["type"]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "teacher", "category", "price"]


@admin.register(CourseLecture)
class CourseLectureAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "course", "order_index"]


@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "course", "purchase_price"]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["id", "author", "target_type", "target_id", "rating"]


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ["id", "session", "sender", "timestamp"]


@admin.register(PremiumTeacherRequest)
class PremiumTeacherRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "status", "submitted_at"]
    list_filter = ["status"]
