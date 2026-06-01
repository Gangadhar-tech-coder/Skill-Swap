"""
URL configuration for the SkillSwap API app.
Maps all endpoints to match the original FastAPI routes exactly.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Health
    path("", views.root),
    path("api/health", views.health_check),

    # Auth
    path("api/auth/register", views.register),
    path("api/auth/login", views.login),

    # User Profile
    path("api/user/profile", views.profile_view),
    path("api/user/profile/<int:user_id>", views.get_user_profile),

    # Skills
    path("api/skills/add", views.add_skill),
    path("api/skills/my", views.get_my_skills),
    path("api/skills/browse", views.browse_skills),
    path("api/skills/<int:skill_id>", views.delete_skill),

    # Sessions
    path("api/sessions/", views.get_sessions),
    path("api/sessions/request", views.request_session),
    path("api/sessions/accept/<int:session_id>", views.accept_session),
    path("api/sessions/reject/<int:session_id>", views.reject_session),
    path("api/sessions/start/<int:session_id>", views.start_session),
    path("api/sessions/complete/<int:session_id>", views.complete_session),
    path("api/sessions/rate/<int:session_id>", views.rate_session),

    # Wallet
    path("api/wallet/", views.get_wallet),
    path("api/wallet/buy-credits", views.buy_credits),
    path("api/wallet/transactions", views.get_transactions),

    # AI Matching
    path("api/match/suggestions", views.get_match_suggestions),

    # Admin
    path("api/admin/users", views.admin_list_users),
    path("api/admin/sessions", views.admin_list_sessions),
    path("api/admin/ban/<int:user_id>", views.admin_ban_user),
    path("api/admin/unban/<int:user_id>", views.admin_unban_user),
    path("api/admin/premium-requests", views.admin_premium_requests),
    path("api/admin/premium-requests/<int:req_id>/approve", views.admin_approve_premium),
    path("api/admin/premium-requests/<int:req_id>/reject", views.admin_reject_premium),
    path("api/admin/stats", views.admin_stats),

    # Premium
    path("api/premium/apply", views.apply_premium),
    path("api/premium/status", views.get_premium_status),

    # Courses - specific routes before generic ones
    path("api/courses/enrolled", views.get_enrolled_courses),
    path("api/courses/<int:course_id>/purchase", views.purchase_course),
    path("api/courses/<int:course_id>/rate", views.rate_course),
    path("api/courses/<int:course_id>", views.get_course_detail),
    path("api/courses/", views.courses_list_create),  # GET=list, POST=create

    # Chat history (HTTP)
    path("api/chat/history/<int:session_id>", views.get_chat_history),
]
