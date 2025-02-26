# scrapers/demo_settings.py

from scrapers.settings import *

DEMO_MODE = True
LOG_LEVEL = "INFO"
LOG_FORMAT = '%(message)s'
TELNETCONSOLE_ENABLED = False

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': LOG_FORMAT,
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        # Limiter les logs internes de Scrapy (afficher uniquement warnings et erreurs)
        'scrapy': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        # Vos modules "core" et votre spider afficheront leurs messages en INFO
        'core': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'scrapers.spiders.ebay_spider': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    }
}
