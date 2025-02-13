# scrapers/settings.py

BOT_NAME = "scrapers_project"

SPIDER_MODULES = ["scrapers.spiders"]
NEWSPIDER_MODULE = "scrapers.spiders"

ROBOTSTXT_OBEY = False

DOWNLOAD_DELAY = 5
CONCURRENT_REQUESTS = 1
COOKIES_ENABLED = True

DEFAULT_REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
}

DOWNLOADER_MIDDLEWARES = {
    'core.middlewares.RandomUserAgentMiddleware': 400,
    'scrapy.downloadermiddlewares.useragent.UserAgentMiddleware': None,
    'core.random_delay_middleware.RandomDelayMiddleware': 500,
}

AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 2.0
AUTOTHROTTLE_MAX_DELAY = 10.0
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0

CLOSESPIDER_ITEMCOUNT = 5

LOG_LEVEL = "DEBUG"

ITEM_PIPELINES = {
    'scrapers.pipelines.MySQLPipeline': 300,
}
