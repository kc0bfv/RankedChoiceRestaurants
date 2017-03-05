from collections import defaultdict
import re

from django.contrib.auth.models import User
from django.db import transaction
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404
from django.urls import reverse

from voting.models import Poll, Vote, VoteSelection, Answer

DEFAULT_POLL = 1

class InvalidAnswer(Exception):
    pass

def yield_valid_answers(request, poll):
    answer_re = re.compile("^answer-(?P<id>[0-9]+)$")
    for key, val in request.POST.items():
        result = answer_re.match(key)
        if result:
            ans_id = result.group("id")
            try:
                answer = Answer.objects.get(pk=ans_id)
            except Answer.DoesNotExist as e:
                raise InvalidAnswer(
                        "Selected answer {} does not exist".format(ans_id))

            if answer.question.poll != poll:
                raise InvalidAnswer(
                        "Selected answer {} from wrong poll".format(ans_id))

            try:
                int_val = int(val)
            except ValueError as e:
                raise InvalidAnswer(
                        "Ranking for answer {} was invalid".format(ans_id))

            if int_val <= 0:
                raise InvalidAnswer(
                        "Ranking for answer {} was invalid".format(ans_id))

            yield (answer, int_val)

def raise_InvalidAnswer_on_invalid_vote(vote_selections):
    #1 Ensure there is at least one vote
    #2 Ensure all answers are from same poll (this should be done already)
    #3 Ensure no answer has a 0 or lower ranking (this should be done already)
    #4 Ensure no ranking is larger than the number of answers for it's question
    #5 Ensure no rankings are duplicated
    #6 Ensure no answer has more than one ranking
    #7 Ensure no rankings are skipped for a question that has answers

    # Ensure there is at least one vote
    try:
        vs = vote_selections[0]
        poll = vs.vote.poll
    except IndexError as e:
        raise InvalidAnswer("No answers were selected")

    question_rankings = defaultdict(list)
    answers_seen = list()
    for vs in vote_selections:
        # Ensure all answers are from same poll (this should be done already)
        if poll != vs.vote.poll:
            raise InvalidAnswer("Not all answers were from same poll")

        # Ensure no answer has a 0 or lower ranking
        if vs.ranking <= 0:
            raise InvalidAnswer("Answer ranking was 0 or lower")

        # Ensure no ranking is larger than num of answers for it's question
        if vs.ranking > len(vs.answer.question.answer_set.all()):
            raise InvalidAnswer("Answer ranking was larger than permissible")

        # Ensure no rankings are duplicated
        if vs.ranking in question_rankings[vs.answer.question]:
            raise InvalidAnswer("Question multiple answers ranked the same")
        question_rankings[vs.answer.question].append(vs.ranking)

        # Ensure no answer has more than one ranking
        if vs.answer in answers_seen:
            raise InvalidAnswer("Answer ranking specified more than once")
        answers_seen.append(vs.answer)

    # Ensure no rankings are skipped for a question that has answers
    for rankings in question_rankings.values():
        rankings.sort()
        if rankings != list(range(1, max(rankings) + 1)):
            raise InvalidAnswer("Question rankings skipped a value")

    return True

def build_poll_data_structure(poll):
    """
    Build a data struction containing all the database's poll data

    :param Poll poll: The poll to build the data for

    :returns tuple:
        (dict poll_data, dict q_a_data)

        poll_data: { question: [ 
            [voter_1_first_answer, voter_1_second_answer, ...],
            [voter_2_first_answer, voter_2_second_answer, ...],
            ],
          question: [...], }

        More information about this is in voting.instant_runoff.instant_runoff

        q_a_data: {question_1: [answer_1, answer_2, ...],
                    question_2: [answer_1, answer_2, ...], ... }
        
        The types of question and answer should match those in poll_dataa
    """
    poll_data = defaultdict(list)
    q_a_data = dict()

    for question in poll.question_set.all():
        for vote in poll.vote_set.all():
            answer_set = question.answer_set.all()
            q_a_data[question] = list(answer_set)

            vote_sel = vote.voteselection_set
            vote_sel = vote_sel.filter(answer__in=answer_set)
            vote_sel = vote_sel.order_by("ranking").all()
            poll_data[question].append([vs.answer for vs in vote_sel])

    return (poll_data, q_a_data)

def index_view(request):
    context = { "polls": Poll.objects.all(), "sticky": "" }
    return render(request, "voting/index.html", context)

def poll_view(request, poll_id=DEFAULT_POLL, sticky=""):
    poll = get_object_or_404(Poll, pk = poll_id)
    context = { "poll": poll, "sticky": sticky }
    return render(request, "voting/poll.html", context)

def ballot_view(request, poll_id=DEFAULT_POLL, error_msg=None, sticky=""):
    poll = get_object_or_404(Poll, pk = poll_id)
    context = { "poll": poll, "error_msg": error_msg, "sticky": sticky,
            "vote_count_method": poll.vote_count_module }
    return render(request, "voting/ballot.html", context)

def submit_vote_view(request, poll_id, sticky=""):
    poll = get_object_or_404(Poll, pk = poll_id)
    # TODO: maybe user management
    user = User.objects.get(username="anonymous")
    vote = Vote(poll=poll, user=user)
    try:
        vote_selections = [
                VoteSelection(vote=vote, answer=answer, ranking=int_val)
                for answer, int_val in yield_valid_answers(request, poll)]
        raise_InvalidAnswer_on_invalid_vote(vote_selections)
    except InvalidAnswer as e:
        return ballot_view(request, poll_id,
                "Invalid Selections: {}".format(e), sticky)

    # Everything was valid, so we'll save the vote
    with transaction.atomic():
        vote.save()
        for vs in vote_selections:
            vs.vote = vote # have to re-set vote because it was saved
            vs.save()

    return HttpResponseRedirect(reverse("voting:thanks", kwargs={"poll_id": poll_id, "sticky": sticky}))

def thanks_view(request, poll_id, sticky=""):
    return results_view(request, poll_id, thanks=True, sticky=sticky)

def results_view(request, poll_id=DEFAULT_POLL, thanks=False, sticky=""):
    poll = get_object_or_404(Poll, pk = poll_id)

    (poll_data, q_a_data) = build_poll_data_structure(poll)

    # TODO: caching!
    (winners, process_info) = poll.vote_count_module.count_poll(
            poll_data, q_a_data)

    # Calculate percentages for bar graph
    percents = defaultdict(dict)
    for question, rounds in process_info.items():
        for ind, round_i in enumerate(rounds):
            tot_votes = sum(round_i.values())
            for answer, votes in round_i.items():
                percents[ind][answer] = int(100 * (float(votes)/tot_votes))

    context = {
            "poll": poll,
            "process_info": process_info,
            "vote_count_method": poll.vote_count_module,
            "q_a_data": q_a_data,
            "winners": winners, 
            "thanks": thanks,
            "sticky": sticky,
            "percents": percents,
            }

    return render(request, "voting/results.html", context)

