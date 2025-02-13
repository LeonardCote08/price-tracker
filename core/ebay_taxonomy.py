# core/ebay_taxonomy.py

import os
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

EBAY_CLIENT_ID = os.getenv("EBAY_CLIENT_ID")
EBAY_CLIENT_SECRET = os.getenv("EBAY_CLIENT_SECRET")

if not EBAY_CLIENT_ID or not EBAY_CLIENT_SECRET:
    raise ValueError("EBAY_CLIENT_ID et EBAY_CLIENT_SECRET doivent être définis dans le .env")

# Environnement d'API : "production" ou "sandbox"
EBAY_ENV = os.getenv("EBAY_ENV", "production")

# URL de base pour l'API Taxonomy
BASE_TAXONOMY_URL = {
    "production": "https://api.ebay.com/commerce/taxonomy/v1/",
    "sandbox": "https://api.sandbox.ebay.com/commerce/taxonomy/v1/"
}

# URL pour OAuth2
OAUTH_URLS = {
    "production": "https://api.ebay.com/identity/v1/oauth2/token",
    "sandbox": "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
}

def get_oauth_token(scope="https://api.ebay.com/oauth/api_scope"):
    """
    Récupère un token OAuth2 via le client_credentials flow.
    """
    client_cred = f"{EBAY_CLIENT_ID}:{EBAY_CLIENT_SECRET}"
    encoded_cred = base64.b64encode(client_cred.encode()).decode()
    
    url = OAUTH_URLS[EBAY_ENV]
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": f"Basic {encoded_cred}"
    }
    data = {
        "grant_type": "client_credentials",
        "scope": scope
    }
    
    resp = requests.post(url, headers=headers, data=data)
    resp.raise_for_status()
    token_data = resp.json()
    access_token = token_data["access_token"]
    return access_token

def get_category_tree(category_tree_id):
    """
    Récupère l'arbre des catégories pour le category_tree_id donné.
    """
    token = get_oauth_token()
    base_url = BASE_TAXONOMY_URL[EBAY_ENV]
    url = f"{base_url}category_tree/{category_tree_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    return resp.json()

def get_default_category_tree_id(marketplace_id="EBAY_US"):
    """
    Récupère le categoryTreeId par défaut pour la marketplace spécifiée.
    URL attendue : 
    GET https://api.ebay.com/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_US
    """
    token = get_oauth_token()
    base_url = BASE_TAXONOMY_URL[EBAY_ENV]
    url = f"{base_url}get_default_category_tree_id"
    params = {"marketplace_id": marketplace_id}
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    resp = requests.get(url, headers=headers, params=params)
    resp.raise_for_status()
    data = resp.json()
    return data.get("categoryTreeId"), data.get("categoryTreeVersion")
