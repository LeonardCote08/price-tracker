# core/random_delay_middleware.py
import time
import random
import logging

logger = logging.getLogger(__name__)

# Quelques codes ANSI basiques pour la coloration
ANSI_GREEN = "\033[92m"
ANSI_RESET = "\033[0m"

class RandomDelayMiddleware:
    def process_request(self, request, spider):
        delay = random.uniform(2, 5)
        msg = (f"{ANSI_GREEN}[ANTI-BLOCKING] Pause of {delay:.2f} seconds before request {request.url}{ANSI_RESET}")
        # Affichage en mode démo via logger et print
        logger.info(msg)
        # Si nous sommes en mode démo, afficher également avec print()
        if spider.settings.getbool("DEMO_MODE"):
            print(msg)
        time.sleep(delay)
