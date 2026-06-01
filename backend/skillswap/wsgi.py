"""
WSGI config for SkillSwap project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillswap.settings')
application = get_wsgi_application()
