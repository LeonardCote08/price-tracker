# core/middlewares.py
import os
import random
import logging
import re

logger = logging.getLogger(__name__)

# Codes ANSI pour colorer les messages dans la console
ANSI_BLUE   = "\033[94m"  # Pour les messages d'User-Agent
ANSI_YELLOW = "\033[93m"  # Pour les messages de proxy
ANSI_RED    = "\033[91m"  # Pour les avertissements/erreurs
ANSI_RESET  = "\033[0m"   # Pour réinitialiser la couleur

class RandomUserAgentMiddleware:
    """Middleware pour attribuer un User-Agent aléatoire à chaque requête."""
    def __init__(self, user_agents=None):
        self.user_agents = user_agents or [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1",
            # Ajoutez d'autres User-Agents ici
        ]

    @classmethod
    def from_crawler(cls, crawler):
        instance = cls()
        instance.crawler = crawler  # Stocke les settings pour y accéder plus tard
        return instance

    def process_request(self, request, spider):
        ua = random.choice(self.user_agents)
        if self.crawler.settings.getbool("DEMO_MODE"):
            message = f"{ANSI_BLUE}[UA ROTATION] Using User-Agent: {ua}{ANSI_RESET}"
            logger.info(message)
            print(message)
        else:
            logger.debug(f"[RandomUserAgent] Using User-Agent: {ua}")
        request.headers["User-Agent"] = ua


class ProxyMiddleware:
    def __init__(self, proxies=None):
        # Stocke la liste des proxys
        self.proxies = proxies or []

    @classmethod
    def from_crawler(cls, crawler):
        """
        Lit le fichier de proxys (chaque ligne au format: host:port:user:pass)
        et le convertit en URL proxy de la forme:
            http://user:pass@host:port
        """
        proxies_file = crawler.settings.get('PROXIES_FILE', 'webshare_proxies.txt')
        proxies_list = []
        if os.path.exists(proxies_file):
            with open(proxies_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue  # Ignore les lignes vides ou commentées
                    try:
                        host, port, user, pwd = line.split(':')
                        proxy_url = f"http://{user}:{pwd}@{host}:{port}"
                        proxies_list.append(proxy_url)
                    except Exception as e:
                        err_msg = f"{ANSI_RED}[ProxyMiddleware] Error reading line: {line} ({e}){ANSI_RESET}"
                        logger.warning(err_msg)
                        print(err_msg)
        else:
            err_msg = f"{ANSI_RED}[ProxyMiddleware] File {proxies_file} not found. No proxies loaded.{ANSI_RESET}"
            logger.warning(err_msg)
            print(err_msg)

        return cls(proxies=proxies_list)

    def process_request(self, request, spider):
        if not self.proxies:
            logger.debug("No proxies available")
            print("No proxies available")
            return

        # Choix aléatoire d'un proxy dans la liste
        proxy = random.choice(self.proxies)
        request.meta['proxy'] = proxy

        if spider.settings.getbool("DEMO_MODE"):
            # Masquer le mot de passe pour l'affichage
            masked_proxy = re.sub(r'(http://)([^:]+):([^@]+)@', r'\1\2:****@', proxy)
            message = f"{ANSI_YELLOW}[PROXY ROTATION] Using proxy: {masked_proxy}{ANSI_RESET}"
            logger.info(message)
            print(message)
        else:
            logger.debug(f"[ProxyMiddleware] Using proxy: {proxy}")
