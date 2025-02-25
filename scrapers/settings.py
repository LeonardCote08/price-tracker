# scrapers/settings.py

BOT_NAME = "scrapers_project"

SPIDER_MODULES = ["scrapers.spiders"]
NEWSPIDER_MODULE = "scrapers.spiders"

ROBOTSTXT_OBEY = False

DOWNLOAD_DELAY = 3
CONCURRENT_REQUESTS = 2
COOKIES_ENABLED = True

DEFAULT_REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
}

# Active le retry
RETRY_ENABLED = True
# Nombre maximum de tentatives (tu peux ajuster ce nombre)
RETRY_TIMES = 5  
# Liste des codes HTTP pour lesquels retry
RETRY_HTTP_CODES = [429, 500, 503]


DOWNLOADER_MIDDLEWARES = {
    'core.middlewares.RandomUserAgentMiddleware': 400,
    'scrapy.downloadermiddlewares.useragent.UserAgentMiddleware': None,
    'core.random_delay_middleware.RandomDelayMiddleware': 500,
    'core.middlewares.ProxyMiddleware': 600, 
    'core.captcha_middleware.CaptchaDetectionMiddleware': 610, 
}


PROXIES_FILE = 'webshare_proxies.txt'

AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 2.0
AUTOTHROTTLE_MAX_DELAY = 10.0
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0


LOG_LEVEL = "DEBUG"

#ITEM_PIPELINES = {
 #   'scrapers.pipelines.MySQLPipeline': 300,
#}
