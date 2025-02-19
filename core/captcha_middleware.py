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
                logger.debug(f"Erreur avec response.text, utilisation de response.body.decode(): {e}")
                try:
                    page_text = response.body.decode('utf-8', errors='ignore')
                except Exception as e2:
                    logger.error(f"Erreur lors de la conversion du contenu en texte: {e2}")
                    page_text = ""
        else:
            # Si le contenu n'est pas du HTML, on ne fait pas de détection CAPTCHA
            return response

        # Recherche des indicateurs de CAPTCHA dans le texte de la page
        if any(re.search(indicator, page_text, re.IGNORECASE) for indicator in captcha_indicators):
            logger.warning(f"CAPTCHA détecté sur {response.url}. Changement de proxy ou pause nécessaire.")
            # Déclenche IgnoreRequest pour permettre au middleware Retry de gérer le changement de proxy
            raise IgnoreRequest("CAPTCHA détecté, requête ignorée pour changer de proxy.")
        
        return response
