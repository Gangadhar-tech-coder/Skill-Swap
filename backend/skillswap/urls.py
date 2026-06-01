"""
URL configuration for SkillSwap project.
Routes all /api/ endpoints to the api app.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("api.urls")),
]
