import sys, os
sys.path.append(os.getcwd())
os.environ['DJANGO_SETTINGS_MODULE'] = "RankedChoiceRestaurants.settings"
import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
