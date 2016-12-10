#!/usr/bin/env python3

import json
import os
import random
import string

from RankedChoiceRestaurants.settings import CONFIG_FILE

def maybe_get_new_val(query, old_val):
    new_val = input("{}? [{}] ".format(query, old_val))
    return new_val if new_val else old_val

def main():
    random.seed()

    try:
        with open(CONFIG_FILE, "r") as f:
            config_dict = json.load(f)
    except FileNotFoundError as e:
        config_dict = dict() 

    if "SECRET_KEY" not in config_dict:
        key_length = 50
        config_dict["SECRET_KEY"] = ''.join(
                random.SystemRandom().choice(
                    string.ascii_letters + string.digits + string.punctuation)
                for _ in range(key_length))
    
    config_dict["ALLOWED_HOST"] = maybe_get_new_val(
            "What's your server's domain name",
            config_dict.get("ALLOWED_HOST", ""))

    database_dict = config_dict.get("DATABASES", dict())
    default_db = database_dict.get("default", dict())
    default_db["ENGINE"] = maybe_get_new_val(
            "What database backend do you want",
            default_db.get("ENGINE", "django.db.backends.mysql"))
    default_db["NAME"] = maybe_get_new_val(
            "What is your database's name",
            default_db.get("NAME", ""))
    default_db["USER"] = maybe_get_new_val(
            "What is your database username",
            default_db.get("USER", ""))
    default_db["PASSWORD"] = maybe_get_new_val(
            "What is your database password",
            default_db.get("PASSWORD", ""))
    default_db["HOST"] = maybe_get_new_val(
            "What is the database's hostname",
            default_db.get("HOST", ""))
    default_db["PORT"] = maybe_get_new_val(
            "What port is the database on",
            default_db.get("PORT", ""))

    database_dict["default"] = default_db
    config_dict["DATABASES"] = database_dict

    config_dict["STATIC_URL"] = maybe_get_new_val(
            "What's the url to access static files",
            config_dict.get("STATIC_URL", ""))
    config_dict["STATIC_ROOT"] = maybe_get_new_val(
            "Where are static files stored on the local server",
            config_dict.get("STATIC_ROOT", ""))

    https = input("Are you using https? [y] ")
    # If the first letter isn't n or N, we're using https.  Therefore, 
    # set CSRF_COOKIE_SECURE to avoid sending csrf cookie over http
    config_dict["CSRF_COOKIE_SECURE"] = https[:1] not in ["n","N"]
    config_dict["SESSION_COOKIE_SECURE"] = https[:1] not in ["n","N"]

    with open(CONFIG_FILE, "w") as f:
        json.dump(config_dict, f)

    print("Run './manage.py collectstatic' to place static files "\
            "in the correct location")

if __name__ == "__main__":
    main()
