import os
import random
import logging

logger = logging.getLogger(__name__)

class RandomUserAgentMiddleware:
    """Middleware pour attribuer un User-Agent aléatoire à chaque requête."""
    def __init__(self, user_agents=None):
        self.user_agents = user_agents or [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) "
            "Gecko/20100101 Firefox/15.0.1",
            # Ajoutez d'autres User-Agents ici
        ]

    @classmethod
    def from_crawler(cls, crawler):
        # Tu pourrais charger une liste custom depuis les settings
        return cls()

    def process_request(self, request, spider):
        ua = random.choice(self.user_agents)
        logger.debug(f"[RandomUserAgent] UA choisi: {ua}")
        request.headers["User-Agent"] = ua


class ProxyMiddleware:
    def __init__(self, proxies=None):
        # On stocke la liste de proxys dans self.proxies
        self.proxies = proxies or []

    @classmethod
    def from_crawler(cls, crawler):
        """
        Lit le fichier de proxys (une ligne = host:port:user:pass).
        Exemple d'une ligne:
            198.23.239.134:6540:plgklmao:jzbr6ip398z2
        On convertit en:
            http://plgklmao:jzbr6ip398z2@198.23.239.134:6540
        """
        # Nom du fichier (peut être défini dans scrapy.cfg ou dans settings)
        proxies_file = crawler.settings.get('PROXIES_FILE', 'webshare_proxies.txt')

        proxies_list = []
        if os.path.exists(proxies_file):
            with open(proxies_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue  # ignore lignes vides ou commentées
                    host, port, user, pwd = line.split(':')
                    proxy_url = f"http://{user}:{pwd}@{host}:{port}"
                    proxies_list.append(proxy_url)
        else:
            logger.warning(f"[ProxyMiddleware] Fichier {proxies_file} introuvable. Aucune liste de proxys chargée.")

        return cls(proxies=proxies_list)

    def process_request(self, request, spider):
        if not self.proxies:
            # Si on n'a pas de proxy chargé, on n'en met pas
            logger.debug("[ProxyMiddleware] Aucune liste de proxy disponible.")
            return

        # Choix aléatoire dans self.proxies
        proxy = random.choice(self.proxies)
        request.meta['proxy'] = proxy
        logger.debug(f"[ProxyMiddleware] Utilisation du proxy: {proxy}")
