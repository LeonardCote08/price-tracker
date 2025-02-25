#!/usr/bin/env python3
import random
from datetime import datetime, timedelta
from core.db_connection import get_connection
from decimal import Decimal


def generate_dummy_prices(base_price, days):
    """Génère une liste de prix avec une variation aléatoire de ±2% autour du prix de base."""
    prices = []
    for _ in range(days):
        variation = random.uniform(-0.02, 0.02)
        price = base_price * (Decimal(1) + Decimal(str(variation)))
        prices.append(round(price, 2))
    return prices

def fill_dummy_price_history():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Sélectionne tous les produits fixed_price
    cursor.execute("SELECT product_id FROM product WHERE listing_type = 'fixed_price'")
    products = cursor.fetchall()
    
    # Définir la date de fin (24 février 2025) et la période de simulation : 90 jours (incluant le jour réel)
    end_date = datetime(2025, 2, 24)
    total_days = 90  # 1 point par jour
    
    for product in products:
        product_id = product['product_id']
        
        # Récupérer le dernier prix réel de la table price_history pour ce produit
        cursor.execute("""
            SELECT price FROM price_history 
            WHERE product_id = %s 
            ORDER BY date_scraped DESC 
            LIMIT 1
        """, (product_id,))
        row = cursor.fetchone()
        if not row:
            print(f"Aucune donnée existante pour product_id {product_id}, saut.")
            continue
        base_price = row['price']
        
        # On considère que la donnée réelle correspond au jour J (24/02/2025).
        # On va générer 89 enregistrements pour les 89 jours précédents.
        dummy_days = total_days - 1  # 89 jours
        dummy_prices = generate_dummy_prices(base_price, dummy_days)
        
        for i in range(dummy_days):
            # Calculer la date pour chaque enregistrement (du plus ancien au plus récent)
            scrape_date = end_date - timedelta(days=(dummy_days - i))
            cursor.execute("""
                INSERT INTO price_history 
                (product_id, price, buy_it_now_price, bids_count, time_remaining, date_scraped)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                product_id,
                dummy_prices[i],
                dummy_prices[i],  # Pour fixed_price, on fixe buy_it_now_price identique
                None,             # bids_count : non applicable pour fixed_price
                None,             # time_remaining : non applicable
                scrape_date.strftime("%Y-%m-%d %H:%M:%S")
            ))
        conn.commit()
        print(f"Produit {product_id}: {dummy_days} enregistrements factices insérés.")
    
    cursor.close()
    conn.close()
    print("Remplissage de price_history terminé.")

if __name__ == "__main__":
    fill_dummy_price_history()
