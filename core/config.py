# config.py 

import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


# Clé eBay
ebay_app_id = os.getenv("EBAY_APP_ID")
if not ebay_app_id:
    raise ValueError("La clé eBay App ID (EBAY_APP_ID) n'est pas définie (.env)")
