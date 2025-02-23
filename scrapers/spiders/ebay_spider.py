#!/usr/bin/env python3
"""
Ce script parcourt les produits en base, revisite leur URL pour actualiser le champ "ended"
et met à jour la base de données avec les prix finaux pour les annonces terminées.
"""

import sys
import requests
from scrapy.selector import Selector
from core.db_connection import get_connection
from scrapers.items import EbayItem
import re

def refresh_product(product):
    url = product["url"]
    if not url:
        return None

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"Erreur lors du téléchargement de {url} : {e}")
        return None

    # Créer un sélecteur Scrapy pour analyser la réponse
    sel = Selector(text=response.text, encoding='utf-8')

    # Détection si l'annonce est terminée
    ended_message = " ".join(sel.xpath('//div[@data-testid="d-statusmessage"]//text()').getall()).strip()
    is_ended = False
    final_price = None

    if ended_message:
        ended_message_lower = ended_message.lower()
        if ("this listing sold on" in ended_message_lower
            or "bidding ended on" in ended_message_lower
            or "this listing was ended by the seller" in ended_message_lower
            or "item sold on" in ended_message_lower):
            is_ended = True
            final_price = sel.xpath('//span[contains(text(), "Sold for")]/following-sibling::span/text()').get()
            if final_price:
                final_price = float(re.search(r'[\d,.]+', final_price).group(0).replace(",", ""))

    # Mise à jour du produit avec le statut "ended" et, si applicable, le prix final
    return {
        "ended": is_ended,
        "price": final_price if final_price else None,  # Pour les annonces terminées
        "product_id": product["product_id"]  # Inclure l'ID pour la mise à jour
    }

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

        # Mettre à jour le champ "ended" dans la table product
        update_product_sql = "UPDATE product SET ended = %s WHERE product_id = %s"
        cursor.execute(update_product_sql, (updated["ended"], prod["product_id"]))
        
        # Si l'annonce est terminée et qu'un prix final est trouvé, mettre à jour price_history
        if updated["ended"] and updated["price"] is not None:
            insert_price_sql = """
                INSERT INTO price_history (product_id, price, buy_it_now_price, date_scraped)
                VALUES (%s, %s, NULL, NOW())
            """
            cursor.execute(insert_price_sql, (prod["product_id"], updated["price"]))
        
        conn.commit()
        refreshed += 1
        print(f"Produit {prod['product_id']} mis à jour : ended = {updated['ended']}, price = {updated['price']}")

    cursor.close()
    conn.close()
    print(f"Refresh terminé pour {refreshed} produits.")

if __name__ == "__main__":
    main()