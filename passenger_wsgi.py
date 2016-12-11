import sys
import os
import os.path

# These next two lines are only required if your default python isn't python3
INTERP = os.path.expanduser("~/opt/bin/python3.5")
if sys.executable != INTERP: os.execl(INTERP, INTERP, *sys.argv)

sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "RankedChoiceRestaurants"))

os.environ["DJANGO_SETTINGS_MODULE"] = "RankedChoiceRestaurants.settings"

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
