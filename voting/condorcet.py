"""
Calculate a poll winner based on a condorcet method
"""

name = "The Condorcet Method"
unranked_explainder = "Any responses you leave off your ballot will be ranked as your least-preferred alternative."

def count_poll(poll_data, q_a_data, *args, **kwargs):
    """
    Run the entire instant runoff voting algorithm on poll_data

    :param dict poll_data:
        { question_1: [ 
            [voter_1_first_answer, voter_1_second_answer, ...],
            [voter_2_first_answer, voter_2_second_answer, ...],
            ],
          question_2: [...], }

        The types of question and *_answer don't matter, but this function
        will use equivalence between different answers in different lists to
        determine who is voting for what - so, things in an aribtrary voter's
        list should be == to things in the other voters' lists.

        The types for *_answer and question should be hashable, so I can use
        them as dictionary keys.

    :param dict q_a_data:
        {question_1: [answer_1, answer_2, ...],
         question_2: [answer_1, answer_2, ...], ... }
        
        The types of question and answer should match those in poll_data.

    :returns tuple:
        (dict winners, dict poll_count)
        winners: {question: [winning_answer, tied_winning_answer, ...], ...}

        poll_count: {
            question_1: {
                    answer_a_1: {
                        answer_b_1: count_of_times_a_1_beat_b_1,
                        answer_b_2: count_of_times_a_1_beat_b_2, ... },
                    answer_a_2: { ... },
                },
                every pairing represented both directions
            question_2: ... 
        }
    """

    poll_count = {
            question: {
                answer_a: {answer_b: 0 for answer_b in q_a_data[question]
                    if answer_b != answer_a}
                for answer_a in q_a_data[question]
                }
            for question in q_a_data
            }

    tally_wins = {question: {winner: 0 for winner in q_a_data[question]}
            for question in q_a_data}

    winners = dict()

    # Count the number of times an answer ranks highest in a matchup between
    # all possible answers
    for question in poll_data:
        all_ans = set(q_a_data[question])
        for vote in poll_data[question]:
            non_ranked_ans = list(all_ans - set(vote))
            for ans_ind in range(len(vote)):
                winner = vote[ans_ind]
                losers = vote[ans_ind+1:] + non_ranked_ans
                for loser in losers:
                    poll_count[question][winner][loser] += 1

    # Count how many matchups each answer won, in aggregate
    for question in poll_data:
        for winner in q_a_data[question]:
            for loser in q_a_data[question]:
                if winner != loser and (
                        poll_count[question][winner][loser] >
                        poll_count[question][loser][winner]
                        ):
                    tally_wins[question][winner] += 1

    # Figure out who won the most matchups - there can be ties...
    for question, win_counts in tally_wins.items():
        best_win_count = max(win_counts.values())
        winners[question] = [winner for winner in win_counts
                if win_counts[winner] == best_win_count]

    return (winners, poll_count)
