from django.db import models
from django.contrib.auth.models import User

from voting import instant_runoff
from voting import condorcet

class Poll(models.Model):
    """A set of questions that users can vote on

    title - string - the name of the poll
    desc - string - a longer description of the poll
    """
    INSTANT_RUNOFF = 0
    CONDORCET = 1
    VOTE_COUNT_CHOICES = {
            (INSTANT_RUNOFF, "Instant Runoff"),
            (CONDORCET, "Condorcet"),
            }
    _vote_count_modules = {
            INSTANT_RUNOFF: instant_runoff,
            CONDORCET: condorcet,
            }

    title = models.CharField(max_length=256)
    desc = models.TextField(default="")
    vote_count_method = models.SmallIntegerField(default=INSTANT_RUNOFF,
            choices=VOTE_COUNT_CHOICES)
    custom_stylesheet = models.TextField(blank=True, default="")

    @property
    def vote_count_module(self):
        return self._vote_count_modules[self.vote_count_method]

    def __str__(self):
        return "{}".format(self.title)
    
class Question(models.Model):
    """One question within a poll

    poll - Poll - the poll this question belongs to
    desc - string - the text of the question
    """
    poll = models.ForeignKey(Poll)
    desc = models.TextField()

    def __str__(self):
        return "{} - {}".format(self.poll, self.desc)

class Answer(models.Model):
    """One selectable response to a question

    question - Question - the question that this is an answer to
    desc - string - the text of the response
    """
    question = models.ForeignKey(Question)
    desc = models.TextField()

    def __str__(self):
        return "{} - {}".format(self.question, self.desc)


class Vote(models.Model):
    """One user's vote response, comprising ranked answers to questions

    user - User - the user this vote is a response for
    time - DateTimeField - the time this vote was cast
    poll - Poll - the poll this is a vote for
    """
    user = models.ForeignKey(User) # TODO: implement this usefully later on
    time = models.DateTimeField(auto_now=True)
    poll = models.ForeignKey(Poll)

    def __str__(self):
        return "{} - {}".format(self.user, self.poll)

class VoteSelection(models.Model):
    """One selection in a Vote - matches a selected answer with a ranking and
    a user

    vote - Vote - the vote this selection belongs to (maps answer to user)
    answer - Answer - the answer this selection maps to
        obviously, this answer should be for a question in the same poll as
        the vote is, otherwise it's invalid
    ranking - Integer - the rank the user gave this answer
        In this version, here are some bounds/assumptions for this ranking:
        - Lower ranking means you want something more, so it's like:
            "what's your #1 choice"
            "what's your second choice"
        - Rankings shouldn't skip numbers.  This means that when you consider
        a user's selections, if there is a 3 then there should be a 1 and a 2
        - Answers that a user does not select do not get VoteSelections.
        That's why they're called VoteSelections - they're things the user
        selected.
        - There are no "0" rankings.  This counting system starts at 1, as in,
        "first choice".  This may prove to be unwise on my part, but we're
        gonna go with it for now.  It's an error to have a 0'th ranking.
    """
    vote = models.ForeignKey(Vote)
    answer = models.ForeignKey(Answer)
    ranking = models.IntegerField()

    def __str__(self):
        return "{} - {} - {}".format(self.ranking, self.answer, self.vote)

