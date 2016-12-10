import random

from django import template

register = template.Library()

@register.filter(nsame="returnitem")
def returnitem(in_iterable, in_key):
    try:
        return in_iterable[in_key]
    except:
        return None

@register.filter
def shuffle(in_iterable):
    listed = list(in_iterable)
    random.shuffle(listed)
    return listed
