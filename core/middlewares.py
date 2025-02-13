import random
import logging

logger = logging.getLogger(__name__)

class RandomUserAgentMiddleware:
    """Middleware pour attribuer un User-Agent aléatoire à chaque requête."""
    def __init__(self, user_agents=None):
        self.user_agents = user_agents or [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1",
            # Ajoutez d'autres User-Agents ici
        ]

    @classmethod
    def from_crawler(cls, crawler):
        return cls()

    def process_request(self, request, spider):
        ua = random.choice(self.user_agents)
        logger.debug(f"User-Agent choisi: {ua}")
        request.headers["User-Agent"] = ua

class ProxyMiddleware:
    # Liste de proxies de test – À remplacer par vos vraies adresses
    PROXIES = [
        "http://username:password@proxy1.example.com:8000",
        "http://username:password@proxy2.example.com:8000",
    ]

    def process_request(self, request, spider):
        proxy = random.choice(self.PROXIES)
        request.meta['proxy'] = proxy
        logger.debug(f"Utilisation du proxy: {proxy}")
