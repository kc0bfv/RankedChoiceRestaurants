"""
Django settings for RankedChoiceRestaurants project.

Generated by 'django-admin startproject' using Django 1.10.2.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.10/ref/settings/
"""

import json
import os

from RankedChoiceRestaurants.config_file_path import CONFIG_FILE

# A quick switch for production/dev
#PRODUCTION = False
PRODUCTION = True

# Pull in the production configuration
if PRODUCTION:
    config_file_dat = json.load(open(CONFIG_FILE, "r"))

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
if PRODUCTION:
    SECRET_KEY = config_file_dat["SECRET_KEY"]
else:
    SECRET_KEY = 'a=4qvg=&gfh=m&z$v-7e5ef-^@@e!cql3n&_1n0d2l$3@&&rbf'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = not PRODUCTION

if PRODUCTION:
    ALLOWED_HOSTS = [config_file_dat["ALLOWED_HOST"]]
else:
    ALLOWED_HOSTS = []

if PRODUCTION:
    CSRF_COOKIE_SECURE = config_file_dat["CSRF_COOKIE_SECURE"]
    SESSION_COOKIE_SECURE = config_file_dat["SESSION_COOKIE_SECURE"]
    SECURE_SSL_REDIRECT = config_file_dat["SECURE_SSL_REDIRECT"]

CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_HTTPONLY = True
X_FRAME_OPTIONS = "DENY"
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Application definition

INSTALLED_APPS = [
    "voting.apps.VotingConfig",
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'RankedChoiceRestaurants.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'RankedChoiceRestaurants.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

if PRODUCTION:
    DATABASES = config_file_dat["DATABASES"]
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }


# Password validation
# https://docs.djangoproject.com/en/1.10/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

if PRODUCTION:
    STATIC_URL = config_file_dat["STATIC_URL"]
    STATIC_ROOT = config_file_dat["STATIC_ROOT"]
else:
    STATIC_URL = '/static/'
