"""
Django settings for timeweb project.

Generated by 'django-admin startproject' using Django 3.1.3.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.1/ref/settings/
"""

from pathlib import Path
import os

# SECURITY WARNING: don't run with debug turned on in production!
try:
    DEBUG = os.environ['DEBUG'] == "True"
except KeyError:
    DEBUG = True
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

CSP_CONNECT_SRC = ("'self'", 'https://www.google-analytics.com', 'https://www.googletagmanager.com', 'https://accounts.google.com', "https://storage.googleapis.com", "https://www.google.com")
CSP_DEFAULT_SRC = ("'self'", 'https://www.googletagmanager.com', "https://storage.googleapis.com", "https://www.google.com", "https://unpkg.com")
CSP_SCRIPT_SRC = CSP_DEFAULT_SRC # Needs to be set so nonce can be added
CSP_INCLUDE_NONCE_IN = ('script-src', ) # Add nonce b64 value to header, use for inline scripts
CSP_OBJECT_SRC = ("'none'", )
CSP_BASE_URI = ("'none'", )
CSP_IMG_SRC = ("'self'", "data:", "https://storage.googleapis.com")

PWA_SERVICE_WORKER_PATH = BASE_DIR / 'timewebapp/static/timewebapp/js/serviceworker.js' if DEBUG else "https://storage.googleapis.com/twstatic/timewebapp/js/serviceworker.js"
PWA_APP_DEBUG_MODE = False
PWA_APP_NAME = "TimeWeb PS" if DEBUG else "TimeWeb"
PWA_APP_DESCRIPTION = "TimeWeb PS APP" if DEBUG else "TimeWeb App"
PWA_APP_THEME_COLOR = '#000000'
PWA_APP_BACKGROUND_COLOR = '#000000'
PWA_APP_DISPLAY = 'fullscreen'
PWA_APP_SCOPE = '/'
PWA_APP_ORIENTATION = 'portrait'
PWA_APP_START_URL = '/'
PWA_APP_DIR = 'ltr'
PWA_APP_LANG = 'en-US'
try:
    SECRET_KEY = os.environ['SECRETKEY']
except KeyError:
    from django.core.management.utils import get_random_secret_key
    SECRET_KEY = get_random_secret_key()
# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.1/howto/deployment/checklist/
if DEBUG:
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = ['timeweb.io']
# Application definition

CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG

SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 31536000 # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'django.contrib.sites',

    'timewebauth',
    'timewebapp',
    'navbar',
    'misc',
    'multiselectfield',
    'django.contrib.admin', # admin needs to be after 'timewebapp' for some reason I forgot but it needs to be here
    'pwa',
    'colorfield',
    'django_cleanup.apps.CleanupConfig',

    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'csp.middleware.CSPMiddleware',
    'timewebapp.middleware.CatchRequestDataTooBig.CatchRequestDataTooBig',
    'timewebapp.middleware.AddSiteID.AddSiteID',
]
CSRF_FAILURE_VIEW = 'misc.views.custom_permission_denied_view'
ROOT_URLCONF = 'timeweb.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')], # Add in registration template
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

LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

WSGI_APPLICATION = 'timeweb.wsgi.application'

MAX_UPLOAD_SIZE = 5242880 # 40 MiB (max background image size)
DATA_UPLOAD_MAX_MEMORY_SIZE = 1310720 # 10 MiB (max size for data sent by ajax by assignments)

# Database
# https://docs.djangoproject.com/en/3.1/ref/settings/#databases
if os.environ.get('DATABASE_URL') is not None:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'HOST': os.environ['PGHOST'],
            'PORT': os.environ['PGPORT'],
            'NAME': os.environ.get('PGDATABASE', 'timewebdb'),
            'USER': os.environ.get('PGUSER', 'postgres'),
            'PASSWORD': os.environ['PGPASSWORD'],
        }
    }
else:
    # If running locally, use a sqlite database
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
DEFAULT_AUTO_FIELD='django.db.models.AutoField' 
# Password validation
# https://docs.djangoproject.com/en/3.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/3.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = "America/Los_Angeles"

USE_I18N = True

USE_L10N = True

USE_TZ = True

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'
# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.1/howto/static-files/
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
if DEBUG:
    STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'
else:
    # Bunch of gitignored files ;)
    DEFAULT_FILE_STORAGE = 'timewebapp.gcloud_storages.GoogleCloudMediaFileStorage'
    STATICFILES_STORAGE = 'timewebapp.gcloud_storages.GoogleCloudStaticFileStorage'
    
    GS_DEFAULT_ACL = None
    GS_QUERYSTRING_AUTH = False
    GS_STATIC_BUCKET_NAME = 'twstatic'
    GS_MEDIA_BUCKET_NAME = 'twmedia'

    GS_PROJECT_ID = 'timeweb-308201'
    from google.oauth2 import service_account
    GS_CREDENTIALS = service_account.Credentials.from_service_account_file(
        BASE_DIR / "sa-private-key.json"
    )
# Django Logging config
ROOT_LOG_LEVEL = 'DEBUG' if DEBUG else 'WARNING'
DJANGO_LOG_LEVEL = 'INFO' if DEBUG else 'WARNING'
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
    },
    'root': {
        'handlers': ['console'],
        'level': ROOT_LOG_LEVEL,
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': DJANGO_LOG_LEVEL,
        }
    },
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d}>> {message}',
            'style': '{',
        },
        'simple': {
            'format': '{asctime} <<{levelname}>> {message}',
            'style': '{',
        },
    },
}

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend'
]
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            # We only need to request for email
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'offline',
        }
    }
}
AUTH_USER_MODEL = 'timewebauth.TimewebUser'
ACCOUNT_DEFAULT_HTTP_PROTOCOL = "http" if DEBUG else "https"
SOCIALACCOUNT_AUTO_SIGNUP = False # Always prompt for username
ACCOUNT_SESSION_REMEMBER = True
ACCOUNT_SIGNUP_PASSWORD_ENTER_TWICE = False

ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = True
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'
ACCOUNT_EMAIL_VERIFICATION = True

SOCIALACCOUNT_ADAPTER = 'timewebauth.adapter.ExampleAccountSocialLoginAdapter'

ACCOUNT_FORMS = {
    'login': 'timewebauth.forms.LabeledLoginForm',
    'signup': 'timewebauth.forms.LabeledSignupForm',
    'add_email': 'timewebauth.forms.LabeledAddEmailForm',
    'change_password': 'timewebauth.forms.LabeledChangePasswordForm',
    'set_password': 'timewebauth.forms.LabeledTwoPasswordForm',
    'reset_password': 'timewebauth.forms.LabeledResetPasswordForm',
    'reset_password_from_key': 'timewebauth.forms.LabeledTwoPasswordForm',
    'disconnect': 'allauth.socialaccount.forms.DisconnectForm',
}

SOCIALACCOUNT_FORMS = {
    'disconnect': 'allauth.socialaccount.forms.DisconnectForm',
    'signup': 'timewebauth.forms.LabeledSocialaccountSignupForm',
}

ACCOUNT_RATE_LIMITS = {
    # Change password view (for users already logged in)
    "change_password": "5/m",
    # Email management (e.g. add, remove, change primary)
    "manage_email": "10/m",
    # Request a password reset, global rate limit per IP
    "reset_password": "20/m",
    # Rate limit measured per individual email address
    "reset_password_email": "5/m",
    # Password reset (the view the password reset email links to).
    "reset_password_from_key": "20/m",
    # Signups.
    "signup": "20/m",
    # NOTE: Login is already protected via `ACCOUNT_LOGIN_ATTEMPTS_LIMIT`
    
    "contact": "60/h",
}

if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
EMAIL_USE_TLS = True
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
ACCOUNT_DEFAULT_HTTP_PROTOCOL = "http" if DEBUG else "https"
ACCOUNT_EMAIL_SUBJECT_PREFIX = ''
DEFAULT_FROM_EMAIL = 'TimeWeb E-mail Service <arhanc.cs@gmail.com>'
EMAIL_HOST_USER = 'arhanc.cs@gmail.com'
MANAGERS = [('Arhan', 'arhan.ch@gmail.com')]
EMAIL_HOST_PASSWORD = os.environ.get('GMAILPASSWORD', None)

EXAMPLE_ACCOUNT_EMAIL = 'timeweb@example.com'

RECAPTCHA_SECRET_KEY = os.environ.get('RECAPTCHA_SECRET_KEY', None)