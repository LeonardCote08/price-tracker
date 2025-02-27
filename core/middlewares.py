# core/middlewares.py
import os
import random
import logging
import re

logger = logging.getLogger(__name__)

# ANSI color codes (if needed)
ANSI_BLUE   = "\033[94m"
ANSI_YELLOW = "\033[93m"
ANSI_RED    = "\033[91m"
ANSI_RESET  = "\033[0m"

class RandomUserAgentMiddleware:
    """Middleware to assign a random User-Agent to each request."""
    def __init__(self, user_agents=None):
        self.user_agents = user_agents or [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1",
            # Add more User-Agents here
        ]

    @classmethod
    def from_crawler(cls, crawler):
        instance = cls()
        instance.crawler = crawler  # Access to settings if needed
        return instance

    def process_request(self, request, spider):
        ua = random.choice(self.user_agents)
        request.headers["User-Agent"] = ua

class ProxyMiddleware:
    def __init__(self, proxies=None):
        self.proxies = proxies or []

    @classmethod
    def from_crawler(cls, crawler):
        """
        Reads the proxies file (each line in the format: host:port:user:pass)
        and converts it to a proxy URL of the form:
            http://user:pass@host:port
        """
        proxies_file = crawler.settings.get('PROXIES_FILE', 'webshare_proxies.txt')
        proxies_list = []
        if os.path.exists(proxies_file):
            with open(proxies_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue  # Skip empty or commented lines
                    try:
                        host, port, user, pwd = line.split(':')
                        proxy_url = f"http://{user}:{pwd}@{host}:{port}"
                        proxies_list.append(proxy_url)
                    except Exception as e:
                        err_msg = f"{ANSI_RED}[ProxyMiddleware] Error reading line: {line} ({e}){ANSI_RESET}"
                        logger.warning(err_msg)
                        print(err_msg, flush=True)
        else:
            err_msg = f"{ANSI_RED}[ProxyMiddleware] File {proxies_file} not found. No proxies loaded.{ANSI_RESET}"
            logger.warning(err_msg)
            print(err_msg, flush=True)
        return cls(proxies=proxies_list)

    def process_request(self, request, spider):
        if not self.proxies:
            return
        proxy = random.choice(self.proxies)
        request.meta['proxy'] = proxy