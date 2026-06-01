"""
Django REST Framework views for all SkillSwap API endpoints.
Replaces all FastAPI routers with DRF APIViews using identical URL paths and response shapes.
"""
from datetime import datetime, timedelta
from django.db.models import Sum, Q
from django.db.models.functions import Coalesce
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import (
    User, Skill, Session, Transaction, Course, CourseLecture,
    CourseEnrollment, Review, ChatMessage, PremiumTeacherRequest,
)
from .serializers import (
    UserRegisterSerializer, UserLoginSerializer, UserProfileSerializer,
    UserUpdateSerializer, UserBriefSerializer, SkillCreateSerializer,
    SkillResponseSerializer, SkillBrowseSerializer, SessionRequestSerializer,
    SessionResponseSerializer, ReviewCreateSerializer, WalletResponseSerializer,
    TransactionResponseSerializer, MatchResultSerializer, AdminUserResponseSerializer,
    PremiumRequestCreateSerializer, PremiumRequestResponseSerializer,
    CourseCreateSerializer, CourseResponseSerializer, CourseEnrollmentResponseSerializer,
    ChatMessageResponseSerializer,
)
from .auth import hash_password, verify_password, create_access_token, get_current_user, get_admin_user
from .exceptions import HttpError


# ======================== HEALTH ========================

@api_view(["GET"])
def root(request):
    return Response({"name": "SkillSwap API", "version": "1.0.0", "status": "running", "docs": "/api/docs/"})

@api_view(["GET"])
def health_check(request):
    return Response({"status": "healthy"})


# ======================== AUTH ========================

@api_view(["POST"])
def register(request):
    ser = UserRegisterSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data
    if User.objects.filter(email=d["email"]).exists():
        raise HttpError(400, "Email already registered")
    user = User.objects.create(
        name=d["name"], email=d["email"], password=hash_password(d["password"]),
        bio=d.get("bio", ""), location=d.get("location", ""), availability=d.get("availability", ""),
    )
    return Response(UserProfileSerializer(user).data, status=status.HTTP_201_CREATED)

@api_view(["POST"])
def login(request):
    ser = UserLoginSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data
    try:
        user = User.objects.get(email=d["email"])
    except User.DoesNotExist:
        raise HttpError(401, "Invalid email or password")
    if not verify_password(d["password"], user.password):
        raise HttpError(401, "Invalid email or password")
    if user.is_banned:
        raise HttpError(403, "Account has been banned")
    token = create_access_token(data={"sub": str(user.id)})
    return Response({"access_token": token, "token_type": "bearer"})


# ======================== USER PROFILE ========================

@api_view(["GET", "PUT"])
def profile_view(request):
    """Combined view: GET=get profile, PUT=update profile."""
    user = get_current_user(request)
    if request.method == "PUT":
        ser = UserUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        for field in ["name", "bio", "location", "availability"]:
            if d.get(field) is not None:
                setattr(user, field, d[field])
        user.save()
        user = User.objects.prefetch_related("skills").get(id=user.id)
    return Response(UserProfileSerializer(user).data)

@api_view(["GET"])
def get_user_profile(request, user_id):
    try:
        user = User.objects.prefetch_related("skills").get(id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")
    return Response(UserProfileSerializer(user).data)


# ======================== SKILLS ========================

@api_view(["POST"])
def add_skill(request):
    user = get_current_user(request)
    ser = SkillCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data
    skill = Skill.objects.create(
        user=user, skill_name=d["skill_name"], skill_type=d["skill_type"],
        skill_level=d.get("skill_level", "intermediate"), description=d.get("description", ""),
    )
    return Response(SkillResponseSerializer(skill).data, status=status.HTTP_201_CREATED)

@api_view(["DELETE"])
def delete_skill(request, skill_id):
    user = get_current_user(request)
    try:
        skill = Skill.objects.get(id=skill_id, user=user)
    except Skill.DoesNotExist:
        raise HttpError(404, "Skill not found")
    skill.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(["GET"])
def get_my_skills(request):
    user = get_current_user(request)
    skills = Skill.objects.filter(user=user)
    return Response(SkillResponseSerializer(skills, many=True).data)

@api_view(["GET"])
def browse_skills(request):
    search = request.query_params.get("search")
    location = request.query_params.get("location")
    skill_type = request.query_params.get("skill_type", "teach")
    min_rating = request.query_params.get("min_rating")

    qs = Skill.objects.select_related("user").filter(user__is_banned=False)
    if skill_type:
        qs = qs.filter(skill_type=skill_type)
    if search:
        qs = qs.filter(skill_name__icontains=search)
    if location:
        qs = qs.filter(user__location__icontains=location)
    if min_rating:
        qs = qs.filter(user__reputation_score__gte=float(min_rating))
    return Response(SkillBrowseSerializer(qs[:50], many=True).data)


# ======================== SESSIONS ========================

@api_view(["POST"])
def request_session(request):
    user = get_current_user(request)
    ser = SessionRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data
    if d["teacher_id"] == user.id:
        raise HttpError(400, "Cannot request a session with yourself")
    try:
        teacher = User.objects.get(id=d["teacher_id"])
    except User.DoesNotExist:
        raise HttpError(404, "Teacher not found")
    if user.skill_credits < d.get("duration", 1.0):
        raise HttpError(400, "Not enough skill credits")
    active = Session.objects.filter(
        Q(teacher=user) | Q(learner=user),
        status__in=["pending", "accepted", "in_progress"]
    ).exists()
    if active:
        raise HttpError(400, "You already have an active or pending skill swap session. Complete or cancel it first.")
    sess = Session.objects.create(
        teacher_id=d["teacher_id"], learner=user, skill_offered=d["skill_offered"],
        skill_requested=d["skill_requested"], duration=d.get("duration", 1.0),
        preferred_time=d.get("preferred_time", ""), status="pending",
    )
    sess = Session.objects.select_related("teacher", "learner").get(id=sess.id)
    return Response(SessionResponseSerializer(sess).data, status=status.HTTP_201_CREATED)

@api_view(["POST"])
def accept_session(request, session_id):
    user = get_current_user(request)
    try:
        sess = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        raise HttpError(404, "Session not found")
    if sess.teacher_id != user.id:
        raise HttpError(403, "Only the teacher can accept")
    if sess.status != "pending":
        raise HttpError(400, "Session is not pending")
    active = Session.objects.filter(
        Q(teacher_id__in=[user.id, sess.learner_id]) | Q(learner_id__in=[user.id, sess.learner_id]),
        status__in=["accepted", "in_progress"]
    ).exists()
    if active:
        raise HttpError(400, "One of the participants is already in an active session")
    sess.status = "accepted"
    sess.save()
    sess = Session.objects.select_related("teacher", "learner").get(id=sess.id)
    return Response(SessionResponseSerializer(sess).data)

@api_view(["POST"])
def reject_session(request, session_id):
    user = get_current_user(request)
    try:
        sess = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        raise HttpError(404, "Session not found")
    if sess.teacher_id != user.id:
        raise HttpError(403, "Only the teacher can reject")
    if sess.status != "pending":
        raise HttpError(400, "Session is not pending")
    sess.status = "rejected"
    sess.save()
    sess = Session.objects.select_related("teacher", "learner").get(id=sess.id)
    return Response(SessionResponseSerializer(sess).data)

@api_view(["POST"])
def start_session(request, session_id):
    user = get_current_user(request)
    try:
        sess = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        raise HttpError(404, "Session not found")
    if user.id not in [sess.teacher_id, sess.learner_id]:
        raise HttpError(403, "Not a participant")
    if sess.status != "accepted":
        raise HttpError(400, "Session must be accepted first")
    sess.status = "in_progress"
    sess.save()
    sess = Session.objects.select_related("teacher", "learner").get(id=sess.id)
    return Response(SessionResponseSerializer(sess).data)

@api_view(["POST"])
def complete_session(request, session_id):
    user = get_current_user(request)
    try:
        sess = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        raise HttpError(404, "Session not found")
    if user.id not in [sess.teacher_id, sess.learner_id]:
        raise HttpError(403, "Not a participant")
    if sess.status not in ["accepted", "in_progress"]:
        raise HttpError(400, "Session cannot be completed in current state")
    teacher = User.objects.get(id=sess.teacher_id)
    learner = User.objects.get(id=sess.learner_id)
    teacher.skill_credits += sess.duration
    teacher.save(update_fields=["skill_credits"])
    learner.skill_credits -= sess.duration
    learner.save(update_fields=["skill_credits"])
    Transaction.objects.create(user=teacher, credits=sess.duration, type="earned",
        description=f"Taught {sess.skill_offered} to {learner.name}", session_id=sess.id)
    Transaction.objects.create(user=learner, credits=sess.duration, type="spent",
        description=f"Learned {sess.skill_requested} from {teacher.name}", session_id=sess.id)
    sess.status = "completed"
    sess.completed_at = datetime.utcnow()
    sess.save()
    sess = Session.objects.select_related("teacher", "learner").get(id=sess.id)
    return Response(SessionResponseSerializer(sess).data)

@api_view(["POST"])
def rate_session(request, session_id):
    user = get_current_user(request)
    ser = ReviewCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    rating_data = ser.validated_data
    try:
        sess = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        raise HttpError(404, "Session not found")
    if sess.status != "completed":
        raise HttpError(400, "Can only rate completed sessions")
    if user.id not in [sess.teacher_id, sess.learner_id]:
        raise HttpError(403, "Not a participant")
    if Review.objects.filter(author=user, target_id=session_id, target_type="session").exists():
        raise HttpError(400, "You have already rated this session")
    target_user_id = sess.teacher_id if user.id == sess.learner_id else sess.learner_id
    Review.objects.create(
        author=user, target_type="session", target_id=sess.id,
        target_user_id=target_user_id, rating=rating_data["rating"], content=rating_data.get("content", ""),
    )
    _update_reputation(target_user_id)
    return Response({"message": "Rating submitted successfully", "rating": rating_data["rating"]})

@api_view(["GET"])
def get_sessions(request):
    user = get_current_user(request)
    sessions = Session.objects.select_related("teacher", "learner").filter(
        Q(teacher=user) | Q(learner=user)
    ).order_by("-created_at")
    return Response(SessionResponseSerializer(sessions, many=True).data)

def _update_reputation(user_id):
    """Recalculate a user's reputation score from all their reviews."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return
    reviews = Review.objects.filter(target_user_id=user_id)
    if reviews.exists():
        avg = reviews.aggregate(avg=Coalesce(Sum("rating") / float(reviews.count()), 5.0))
        user.reputation_score = round(avg["avg"], 2)
        user.save(update_fields=["reputation_score"])


# ======================== WALLET ========================

@api_view(["POST"])
def buy_credits(request):
    from .serializers import BuyCreditsSerializer
    user = get_current_user(request)
    ser = BuyCreditsSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data
    
    amount = d["amount"]
    
    # Mock payment processing
    user.skill_credits += amount
    user.save(update_fields=["skill_credits"])
    
    Transaction.objects.create(
        user=user, 
        credits=amount, 
        type="purchased",
        description=f"Purchased {amount} credits using {d.get('payment_method', 'Credit Card')}"
    )
    
    return Response({"message": f"Successfully purchased {amount} credits", "new_balance": user.skill_credits})

@api_view(["GET"])
def get_wallet(request):
    user = get_current_user(request)
    total_earned = Transaction.objects.filter(user=user, type__in=["earned", "purchased"]).aggregate(
        total=Coalesce(Sum("credits"), 0.0))["total"]
    total_spent = Transaction.objects.filter(user=user, type="spent").aggregate(
        total=Coalesce(Sum("credits"), 0.0))["total"]
    next_in_days = None
    if user.last_weekly_credits_at:
        next_date = user.last_weekly_credits_at + timedelta(days=7)
        delta = (next_date - datetime.utcnow()).days
        next_in_days = max(0, delta)
    return Response(WalletResponseSerializer({
        "skill_credits": user.skill_credits, "total_earned": float(total_earned),
        "total_spent": float(total_spent), "last_weekly_credits_at": user.last_weekly_credits_at,
        "next_weekly_credits_in_days": next_in_days,
    }).data)

@api_view(["GET"])
def get_transactions(request):
    user = get_current_user(request)
    txns = Transaction.objects.filter(user=user).order_by("-created_at")[:50]
    return Response(TransactionResponseSerializer(txns, many=True).data)


# ======================== AI MATCHING ========================

@api_view(["GET"])
def get_match_suggestions(request):
    user = get_current_user(request)
    try:
        from .services.matching import find_matches
        matches = find_matches(user, limit=10)
    except Exception as e:
        print(f"Match error: {e}")
        return Response([])
    results = []
    for m in matches:
        u = m["user"]
        results.append({
            "user": UserBriefSerializer(u).data,
            "compatibility_score": m["compatibility_score"],
            "matching_skills": m["matching_skills"],
            "skills_they_teach": m["skills_they_teach"],
            "skills_they_learn": m["skills_they_learn"],
        })
    return Response(results)


# ======================== ADMIN ========================

@api_view(["GET"])
def admin_list_users(request):
    get_admin_user(request)
    users = User.objects.order_by("-created_at")
    return Response(AdminUserResponseSerializer(users, many=True).data)

@api_view(["GET"])
def admin_list_sessions(request):
    get_admin_user(request)
    sessions = Session.objects.order_by("-created_at")[:100]
    return Response(SessionResponseSerializer(sessions, many=True).data)

@api_view(["POST"])
def admin_ban_user(request, user_id):
    get_admin_user(request)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")
    if user.is_admin:
        raise HttpError(400, "Cannot ban an admin")
    user.is_banned = True
    user.save(update_fields=["is_banned"])
    return Response({"message": f"User {user.name} has been banned"})

@api_view(["POST"])
def admin_unban_user(request, user_id):
    get_admin_user(request)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")
    user.is_banned = False
    user.save(update_fields=["is_banned"])
    return Response({"message": f"User {user.name} has been unbanned"})

@api_view(["GET"])
def admin_premium_requests(request):
    get_admin_user(request)
    reqs = PremiumTeacherRequest.objects.select_related("user").order_by("-submitted_at")
    return Response(PremiumRequestResponseSerializer(reqs, many=True).data)

@api_view(["POST"])
def admin_approve_premium(request, req_id):
    get_admin_user(request)
    try:
        req = PremiumTeacherRequest.objects.get(id=req_id)
    except PremiumTeacherRequest.DoesNotExist:
        raise HttpError(404, "Request not found")
    req.status = "approved"
    req.save()
    try:
        user = User.objects.get(id=req.user_id)
        user.is_premium_teacher = True
        user.verification_status = "approved"
        user.license_document = req.document_url
        user.save()
    except User.DoesNotExist:
        pass
    return Response({"message": "Request approved successfully"})

@api_view(["POST"])
def admin_reject_premium(request, req_id):
    get_admin_user(request)
    try:
        req = PremiumTeacherRequest.objects.get(id=req_id)
    except PremiumTeacherRequest.DoesNotExist:
        raise HttpError(404, "Request not found")
    req.status = "rejected"
    req.save()
    try:
        user = User.objects.get(id=req.user_id)
        user.verification_status = "rejected"
        user.save()
    except User.DoesNotExist:
        pass
    return Response({"message": "Request rejected"})

@api_view(["GET"])
def admin_stats(request):
    get_admin_user(request)
    return Response({
        "total_users": User.objects.count(),
        "total_sessions": Session.objects.count(),
        "completed_sessions": Session.objects.filter(status="completed").count(),
        "banned_users": User.objects.filter(is_banned=True).count(),
        "total_courses": Course.objects.count(),
        "pending_premium": PremiumTeacherRequest.objects.filter(status="pending").count(),
    })


# ======================== PREMIUM ========================

@api_view(["POST"])
def apply_premium(request):
    user = get_current_user(request)
    ser = PremiumRequestCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data
    if user.is_premium_teacher:
        raise HttpError(400, "You are already a Premium Teacher")
    if PremiumTeacherRequest.objects.filter(user=user, status="pending").exists():
        raise HttpError(400, "You already have a pending application")
    req = PremiumTeacherRequest.objects.create(user=user, document_url=d["document_url"], status="pending")
    user.verification_status = "pending"
    user.save(update_fields=["verification_status"])
    return Response(PremiumRequestResponseSerializer(req).data)

@api_view(["GET"])
def get_premium_status(request):
    user = get_current_user(request)
    req = PremiumTeacherRequest.objects.filter(user=user).order_by("-submitted_at").first()
    if not req:
        return Response({"status": "none", "id": 0, "user_id": user.id, "document_url": ""})
    return Response(PremiumRequestResponseSerializer(req).data)


# ======================== COURSES ========================

@api_view(["GET", "POST"])
def courses_list_create(request):
    """Combined view: GET=list all courses, POST=create course."""
    if request.method == "POST":
        user = get_current_user(request)
        if not user.is_premium_teacher:
            raise HttpError(403, "Only approved Premium Teachers can create courses")
        ser = CourseCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        course = Course.objects.create(
            teacher=user, title=d["title"], description=d.get("description", ""),
            category=d["category"], price=d["price"], thumbnail_url=d.get("thumbnail_url"),
        )
        total_dur = 0.0
        for i, lec in enumerate(d.get("lectures", [])):
            CourseLecture.objects.create(
                course=course, title=lec["title"], video_url=lec["video_url"],
                duration=lec.get("duration", 0.0), order_index=i,
            )
            total_dur += lec.get("duration", 0.0)
        course.total_duration = total_dur
        course.save(update_fields=["total_duration"])
        course = Course.objects.select_related("teacher").prefetch_related("lectures").get(id=course.id)
        return Response(CourseResponseSerializer(course).data, status=status.HTTP_201_CREATED)
    # GET
    courses = Course.objects.select_related("teacher").prefetch_related("lectures").order_by("-created_at")
    data = CourseResponseSerializer(courses, many=True).data
    for c in data:
        for lec in c.get("lectures", []):
            lec["video_url"] = "hidden_until_purchased"
    return Response(data)

@api_view(["GET"])
def get_enrolled_courses(request):
    user = get_current_user(request)
    enrollments = CourseEnrollment.objects.select_related(
        "course__teacher"
    ).prefetch_related("course__lectures").filter(user=user).order_by("-purchased_at")
    return Response(CourseEnrollmentResponseSerializer(enrollments, many=True).data)

@api_view(["GET"])
def get_course_detail(request, course_id):
    user = get_current_user(request)
    try:
        course = Course.objects.select_related("teacher").prefetch_related("lectures").get(id=course_id)
    except Course.DoesNotExist:
        raise HttpError(404, "Course not found")
    data = CourseResponseSerializer(course).data
    is_teacher = course.teacher_id == user.id
    is_enrolled = CourseEnrollment.objects.filter(course=course, user=user).exists()
    if not (is_teacher or is_enrolled):
        for lec in data.get("lectures", []):
            lec["video_url"] = "hidden_until_purchased"
    return Response(data)

@api_view(["POST"])
def purchase_course(request, course_id):
    user = get_current_user(request)
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        raise HttpError(404, "Course not found")
    if course.teacher_id == user.id:
        raise HttpError(400, "You cannot buy your own course")
    if CourseEnrollment.objects.filter(course=course, user=user).exists():
        raise HttpError(400, "You are already enrolled in this course")
    if user.skill_credits < course.price:
        raise HttpError(400, "Not enough skill credits to purchase this course")
    user.skill_credits -= course.price
    user.save(update_fields=["skill_credits"])
    teacher = User.objects.get(id=course.teacher_id)
    teacher.skill_credits += course.price
    teacher.save(update_fields=["skill_credits"])
    Transaction.objects.create(user=teacher, credits=course.price, type="earned",
        description=f"Course '{course.title}' purchased by {user.name}", course_id=course.id)
    Transaction.objects.create(user=user, credits=course.price, type="spent",
        description=f"Purchased course '{course.title}'", course_id=course.id)
    enrollment = CourseEnrollment.objects.create(user=user, course=course, purchase_price=course.price)
    enrollment = CourseEnrollment.objects.select_related("course__teacher").prefetch_related("course__lectures").get(id=enrollment.id)
    return Response(CourseEnrollmentResponseSerializer(enrollment).data)

@api_view(["POST"])
def rate_course(request, course_id):
    user = get_current_user(request)
    ser = ReviewCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    rd = ser.validated_data
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        raise HttpError(404, "Course not found")
    if not CourseEnrollment.objects.filter(course=course, user=user).exists():
        raise HttpError(403, "You must purchase the course before rating it")
    if Review.objects.filter(author=user, target_id=course_id, target_type="course").exists():
        raise HttpError(400, "You have already rated this course")
    Review.objects.create(
        author=user, target_type="course", target_id=course.id,
        target_user_id=course.teacher_id, rating=rd["rating"], content=rd.get("content", ""),
    )
    _update_reputation(course.teacher_id)
    return Response({"message": "Course rated successfully", "rating": rd["rating"]})


# ======================== CHAT HISTORY ========================


@api_view(["GET"])
def get_chat_history(request, session_id):
    get_current_user(request)
    messages = ChatMessage.objects.filter(session_id=session_id).order_by("timestamp")
    result = [{"id": m.id, "session_id": m.session_id, "sender_id": m.sender_id,
               "message": m.message, "timestamp": m.timestamp.isoformat()} for m in messages]
    return Response(result)
