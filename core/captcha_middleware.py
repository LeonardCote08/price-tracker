import re
import logging
from scrapy.exceptions import IgnoreRequest
from scrapy.http import TextResponse

logger = logging.getLogger(__name__)

class CaptchaDetectionMiddleware:
    def process_response(self, request, response, spider):
        # Traiter uniquement les réponses textuelles
        if not isinstance(response, TextResponse):
            return response

        # Liste des indicateurs de CAPTCHA
        captcha_indicators = [
            r"captcha",
            r"please verify",
            r"pardon our interruption",
            r"are you a human"
        ]

        # Essayer d'obtenir le contenu en texte
        try:
            page_text = response.text
        except Exception as e:
            logger.debug(f"Erreur lors de l'accès à response.text: {e}")
            try:
                page_text = response.body.decode('utf-8', errors='ignore')
            except Exception as e2:
                logger.error(f"Erreur lors de la conversion du contenu en texte: {e2}")
                page_text = ""

        # Si aucun texte n'est disponible, ne pas effectuer de détection
        if not page_text:
            return response

        # Recherche d'indicateurs de CAPTCHA dans le contenu
        if any(re.search(indicator, page_text, re.IGNORECASE) for indicator in captcha_indicators):
            logger.warning(f"CAPTCHA détecté sur {response.url}. Changement de proxy ou pause nécessaire.")
            raise IgnoreRequest("CAPTCHA détecté, requête ignorée pour changer de proxy.")

        return response
