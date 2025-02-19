import re
import logging
from scrapy.exceptions import IgnoreRequest

logger = logging.getLogger(__name__)

class CaptchaDetectionMiddleware:
    def process_response(self, request, response, spider):
        # Liste des indicateurs de CAPTCHA
        captcha_indicators = [
            r"captcha",
            r"please verify",
            r"pardon our interruption",
            r"are you a human"
        ]

        # Vérifie que le Content-Type indique un contenu textuel (HTML)
        content_type = response.headers.get('Content-Type', b'').decode('utf-8', errors='ignore')
        if "html" in content_type.lower():
            try:
                page_text = response.text
            except Exception as e:
                logger.debug(f"Erreur lors de l'accès à response.text: {e}")
                try:
                    page_text = response.body.decode('utf-8', errors='ignore')
                except Exception as e2:
                    logger.error(f"Erreur lors de la conversion du contenu en texte: {e2}")
                    page_text = ""
        else:
            # Si le contenu n'est pas du HTML, on ne fait pas de détection CAPTCHA
            return response

        # Si le texte est vide, on ignore la détection pour éviter de lever une erreur inutile
        if not page_text:
            return response

        # Recherche des indicateurs de CAPTCHA dans le texte de la page
        if any(re.search(indicator, page_text, re.IGNORECASE) for indicator in captcha_indicators):
            logger.warning(f"CAPTCHA détecté sur {response.url}. Changement de proxy ou pause nécessaire.")
            # Lever IgnoreRequest afin de permettre au middleware Retry de changer de proxy
            raise IgnoreRequest("CAPTCHA détecté, requête ignorée pour changer de proxy.")

        return response
