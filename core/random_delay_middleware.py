# core/random_delay_middleware.py
import time
import random
import logging

logger = logging.getLogger(__name__)

class RandomDelayMiddleware:
    # Délais aléatoires entre 1 et 3 secondes (modifie selon tes besoins)
    def process_request(self, request, spider):
        delay = random.uniform(1, 3)
        logger.debug(f"Pause de {delay:.2f} secondes avant la requête {request.url}")
        time.sleep(delay)
