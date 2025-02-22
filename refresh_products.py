#!/usr/bin/env python3
"""
Ce script charge les URLs des produits depuis la base de données,
les revisite pour actualiser le champ "ended" et met à jour la base.
Vous pouvez ensuite le planifier (via cron, par exemple) pour un refresh régulier.
"""

import sys
import requests
from scrapy.http import TextResponse, Request
from core.db_connection import get_connection
from scrapers.spiders.ebay_spider import EbaySpider
from scrapers.items import EbayItem

def refresh_product(product):
    url = product["url"]
    if not url:
        return

    # Télécharger la page du produit
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
    except Exception as e:
        print(f"Erreur lors du téléchargement de {url} : {e}")
        return

    # Créer une réponse Scrapy pour réutiliser parse_item
    response = TextResponse(url=url, body=r.text, encoding='utf-8')
    # Simuler la requête avec l'item dans meta
    item = EbayItem()
    item["url"] = url
    item["item_url"] = url
    item["title"] = product["title"]
    req = Request(url=url, meta={'item': item})
    response.request = req

    # Instancier le spider (sans lancer le scraping complet)
    spider = EbaySpider()
    # Appeler parse_item pour actualiser l'item (la logique "ended" s'y trouve)
    for updated_item in spider.parse_item(response):
        return updated_item  # Retourne le premier item traité

def main():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT product_id, url, title FROM product")
    products = cursor.fetchall()

    refreshed = 0
    for prod in products:
        updated = refresh_product(prod)
        if updated is None:
            continue

        # Mettre à jour le champ "ended" dans la base
        update_sql = "UPDATE product SET ended = %s WHERE product_id = %s"
        cursor.execute(update_sql, (updated.get("ended", False), prod["product_id"]))
        conn.commit()
        refreshed += 1
        print(f"Produit {prod['product_id']} mis à jour : ended = {updated.get('ended', False)}")

    cursor.close()
    conn.close()
    print(f"Refresh terminé pour {refreshed} produits.")

if __name__ == "__main__":
    main()
