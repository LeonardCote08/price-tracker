import re
import logging
from scrapy.exceptions import IgnoreRequest

logger = logging.getLogger(__name__)

class CaptchaDetectionMiddleware:
    def process_response(self, request, response, spider):
        # Vérifie si la réponse contient un indice de CAPTCHA
        captcha_indicators = [
            r"captcha", 
            r"please verify", 
            r"pardon our interruption", 
            r"are you a human"
        ]
        if any(re.search(indicator, response.text, re.IGNORECASE) for indicator in captcha_indicators):
            logger.warning(f"CAPTCHA détecté sur {response.url}. Changement de proxy ou pause nécessaire.")
            # On peut choisir ici de:
            # - Laisser la requête échouer et être retentée par le retry middleware
            # - Ou lever une exception pour l'ignorer (IgnoreRequest)
            # Ici, nous utilisons IgnoreRequest pour déclencher un retry avec un autre proxy.
            raise IgnoreRequest("CAPTCHA détecté, requête ignorée pour changer de proxy.")
        return response
