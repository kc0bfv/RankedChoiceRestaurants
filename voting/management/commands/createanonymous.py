from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

class Command(BaseCommand):
    help="Creates the anonymous user required by default"
    
    def handle(self, *args, **kwargs):
        if not User.objects.filter(username="anonymous").exists():
            anon = User.objects.create_user("anonymous")
            anon.save()
        else:
            raise CommandError("Anonymous user already exists")

        self.stdout.write(self.style.SUCCESS(
            "Successfully created anonymous user"))
