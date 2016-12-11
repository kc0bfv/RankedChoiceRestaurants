"""
Calculate a winner based on instant_runoff voting
"""

from collections import defaultdict
from math import floor

name = "Instant Runoff"
unranked_explainder = "Any responses you leave off your ballot are counted as responses for which you have no opinion."

def resolve_vote(vote, eliminated):
    """Return the voter's top choice, except for the eliminated choices
    
    :param list vote:
        A list of potential votes
    :param list eliminated:
        Items that may be in vote that should be ignored

    :returns item:
    """
    for item in vote:
        if item not in eliminated:
            return item
    return None

def find_rcv_winner(answer_tally):
    """Find the winner, per ranked-choice-vote, or None

    :param dict answer_tally:
        {item (representing an answer choice) : int vote_count}

    :returns item or None:
    """
    # This will set minimum_to_win to the smallest integer greater than 
    # half of total_votes - ranked-choice-voting requires a candidate to get
    # "more than half" the votes.
    minimum_to_win = floor(sum(answer_tally.values()) / 2) + 1

    winners = [answer for answer in answer_tally
            if answer_tally[answer] >= minimum_to_win]

    if len(winners) > 1:
        raise RuntimeError("Too many winners found")
    elif len(winners) != 1:
        return None

    return winners[0]

def find_rcv_to_elim(answer_tally):
    """Determine the lowest ranking choices, they'll be eliminated

    :param dict answer_tally:
        {item (representing an answer choice) : int vote_count}

    :returns list:
    """
    try:
        lowest_count = min(answer_tally.values())
    except ValueError as e:
        # answer_tally was empty
        return []
    
    return [key for key in answer_tally if answer_tally[key] == lowest_count]

def count_poll(poll_data, *args, **kwargs):
    """
    Run the entire instant runoff voting algorithm on poll_data

    Instant runoff cannot return a tied election, but it can return an
    election with no winner.  Still, values in the winners dictionary
    will be in list format, to be compatible with the caller's requirements

    :param dict poll_data:
        { question: [ 
            [voter_1_first_answer, voter_1_second_answer, ...],
            [voter_2_first_answer, voter_2_second_answer, ...],
            ],
          question: [...], }

        The types of question and *_answer don't matter, but this function
        will use equivalence between different answers in different lists to
        determine who is voting for what - so, things in an aribtrary voter's
        list should be == to things in the other voters' lists.

        The types for *_answer and question should be hashable, so I can use
        them as dictionary keys.

    :returns tuple:
        (dict winners, dict round_data)
        winners: { question: [answer] }

        round_data: {
            question1: [
                {answer1: round1_vote_count, answer2: round1_vote_count, ...},
                {answer1: round2_vote_count, ... }, ... ]
            question2: [ ... ]
                }
    """
    round_data = defaultdict(list)
    winners = dict()

    for question in poll_data:
        round_num = 0
        eliminated_answers = list()
        unique_answers = set(["not empty"])
        winner = None
        could_eliminate = True
        while winner is None and could_eliminate and unique_answers:
            # Tally the answers
            round_votes = list()
            for vote in poll_data[question]:
                rv = resolve_vote(vote, eliminated_answers)
                if rv is not None:
                    round_votes.append(rv)
            unique_answers = set(round_votes)
            answer_tally = {answer: round_votes.count(answer)
                    for answer in unique_answers}

            # Save the round data
            round_data[question].append(answer_tally)

            # Determine if there's a winner
            winner = find_rcv_winner(answer_tally)

            # Determine which choice to eliminate if there's a next round
            next_to_elim = find_rcv_to_elim(answer_tally)
            if next_to_elim:
                eliminated_answers.extend(next_to_elim)
            else:
                could_eliminate = False

        # It may be possible for winner to be None...
        winners[question] = [winner] if winner else list()

    # Return round_data as a dictionary - django doesn't like defaultdict
    return (winners, dict(round_data))
