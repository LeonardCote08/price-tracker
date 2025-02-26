# core/random_delay_middleware.py
import time
import random
import logging

logger = logging.getLogger(__name__)

# Quelques codes ANSI basiques pour la coloration
ANSI_GREEN = "\033[92m"
ANSI_RESET = "\033[0m"

def shorten_url(url, max_length=60):
    """Retourne l'URL tronquée si elle dépasse max_length caractères."""
    return url if len(url) <= max_length else url[:max_length] + "..."

class RandomDelayMiddleware:
    def process_request(self, request, spider):
        delay = random.uniform(2, 5)
        short_url = shorten_url(request.url)
        msg = (f"{ANSI_GREEN}[ANTI-BLOCKING] Pause of {delay:.2f} seconds before request {short_url}{ANSI_RESET}")
        if spider.settings.getbool("DEMO_MODE"):
            print(msg, flush=True)
        time.sleep(delay)
