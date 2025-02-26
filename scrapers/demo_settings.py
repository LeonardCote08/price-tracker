from scrapers.settings import *

DEMO_MODE = True
LOG_LEVEL = "INFO"
LOG_FORMAT = '%(message)s'
TELNETCONSOLE_ENABLED = False

SPIDER_MIDDLEWARES = {
    'scrapy.spidermiddlewares.httperror.HttpErrorMiddleware': None,
    'core.custom_http_error_middleware.CustomHttpErrorMiddleware': 50,
}

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
        # Masquer la majorité des messages internes de Scrapy et Twisted
        'scrapy': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'twisted': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        # Pour les modules techniques de votre projet, on ne montre que les avertissements
        'core.middlewares': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'core.random_delay_middleware': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'core.custom_http_error_middleware': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        # Vos messages explicatifs dans le spider s'afficheront (niveau INFO)
        'scrapers.spiders.ebay_spider': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    }
}
