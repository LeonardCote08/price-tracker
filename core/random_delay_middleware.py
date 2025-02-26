# core/random_delay_middleware.py
import time
import random
import logging

logger = logging.getLogger(__name__)

class RandomDelayMiddleware:
    # Délais aléatoires entre 2 et 5 secondes
    def process_request(self, request, spider):
        delay = random.uniform(2, 5)
        if request.meta.get('demo_mode') or (hasattr(request, 'crawler') and request.crawler.settings.getbool("DEMO_MODE")):
            logger.info(f"Delay of {delay:.2f} seconds before request {request.url}")
        else:
            logger.debug(f"Delay of {delay:.2f} seconds before request {request.url}")

        time.sleep(delay)

