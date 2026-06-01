"""
Authentication utilities: JWT token creation/verification, password hashing.
Mirrors the FastAPI auth.py exactly.
"""
import os
from datetime import datetime, timedelta
from functools import wraps

from django.conf import settings
from jose import JWTError, jwt
from passlib.context import CryptContext
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

from .models import User, Transaction

# Configuration
SECRET_KEY = getattr(settings, "JWT_SECRET_KEY", os.getenv("SECRET_KEY", "skillswap-super-secret-key-change-in-production"))
ALGORITHM = getattr(settings, "JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = getattr(settings, "JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta=None) -> str:
    """
    Create a JWT access token with the given payload.
    Default expiry is 24 hours.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(request) -> User:
    """
    Extract and validate the JWT token from the Authorization header.
    Returns the current authenticated user or raises 401.
    """
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header.startswith("Bearer "):
        raise AuthenticationFailed("Invalid or missing token")

    token = auth_header.split(" ", 1)[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise AuthenticationFailed("Invalid or expired token")
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise AuthenticationFailed("Invalid or expired token")

    try:
        user = User.objects.prefetch_related("skills").get(id=user_id)
    except User.DoesNotExist:
        raise AuthenticationFailed("Invalid or expired token")

    if user.is_banned:
        raise PermissionDenied("Account has been banned")

    # Weekly Credit Allocation
    now = datetime.utcnow()
    if user.last_weekly_credits_at and (now - user.last_weekly_credits_at).days >= 7:
        user.skill_credits += 5.0
        user.last_weekly_credits_at = now
        user.save(update_fields=["skill_credits", "last_weekly_credits_at"])
        Transaction.objects.create(
            user=user,
            credits=5.0,
            type="allocated",
            description="Weekly 5 free skill credits allocated.",
        )

    return user


def get_admin_user(request) -> User:
    """Ensure the current user is an admin."""
    user = get_current_user(request)
    if not user.is_admin:
        raise PermissionDenied("Admin access required")
    return user
