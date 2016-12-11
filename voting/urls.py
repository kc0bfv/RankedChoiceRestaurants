from django.conf.urls import url

from . import views

app_name = "voting"
urlpatterns = [
        url(r"^$", views.index_view, name="index"),

        url(r"^poll/$", views.poll_view),
        url(r"^poll/(?P<sticky>(?:sticky/)?)(?P<poll_id>[0-9]+)/$", views.poll_view, name="poll"),

        url(r"^ballot/$", views.ballot_view),
        url(r"^ballot/(?P<sticky>(?:sticky/)?)(?P<poll_id>[0-9]+)/$", views.ballot_view, name="ballot"),

        url(r"^results/$", views.results_view),
        url(r"^results/(?P<sticky>(?:sticky/)?)(?P<poll_id>[0-9]+)/$", views.results_view, name="results"),

        url(r"^submitvote/(?P<sticky>(?:sticky/)?)(?P<poll_id>[0-9]+)/$", views.submit_vote_view, name="submit_vote"),

        url(r"^thankyou/(?P<sticky>(?:sticky/)?)(?P<poll_id>[0-9]+)/$", views.thanks_view, name="thanks"),
        ]
