# core/random_delay_middleware.py
import time
import random
import logging

logger = logging.getLogger(__name__)

# Quelques codes ANSI basiques
ANSI_GREEN = "\033[92m"
ANSI_RESET = "\033[0m"

class RandomDelayMiddleware:
    def process_request(self, request, spider):
        delay = random.uniform(2, 5)
        # On loggue un message 'INFO' (vous pouvez ajuster en 'DEBUG')
        # On précise que c’est pour éviter le blocage.
        msg = (f"{ANSI_GREEN}[ANTI-BLOCKING] Pause of {delay:.2f} seconds before "
               f"request {request.url}{ANSI_RESET}")
        logger.info(msg)
        time.sleep(delay)
