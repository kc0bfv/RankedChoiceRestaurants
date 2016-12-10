from django.contrib import admin

from voting.models import Poll, Question, Answer, Vote, VoteSelection

# Register your models here.
admin.site.register(Poll)
admin.site.register(Question)
admin.site.register(Answer)
admin.site.register(Vote)
admin.site.register(VoteSelection)
