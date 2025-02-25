#!/usr/bin/env python3
import random
from decimal import Decimal
from datetime import datetime, timedelta
from core.db_connection import get_connection

def generate_smoother_prices(base_price_decimal, days):
    """
    Génère une tendance légèrement haussière (ex. +4 $ sur la période)
    avec une fluctuation quotidienne de +/- 0,5 % max.
    Par ailleurs, ~30% des jours conservent le prix de la veille 
    (pas de changement ce jour-là).
    """
    base_price_float = float(base_price_decimal)
    
    # On veut aller d'environ (base_price - 2$) à (base_price + 2$) sur 'days' jours
    trend_start = base_price_float - 2.0
    trend_end   = base_price_float + 2.0
    daily_increase = (trend_end - trend_start) / (days - 1)

    prices = []
    for i in range(days):
        if i == 0:
            # Premier jour : prix linéaire + variation
            linear_price = trend_start
            variation_percent = random.uniform(-0.005, 0.005)
            final_price = linear_price * (1 + variation_percent)
            final_price_dec = Decimal(str(round(final_price, 2)))
            prices.append(final_price_dec)
        else:
            # Calcul linéaire pur
            linear_price = trend_start + (daily_increase * i)
            variation_percent = random.uniform(-0.005, 0.005)
            final_price = linear_price * (1 + variation_percent)
            final_price_dec = Decimal(str(round(final_price, 2)))
            
            # 30% de chance de garder le même prix que la veille
            if random.random() < 0.30:
                final_price_dec = prices[-1]
            
            prices.append(final_price_dec)

    return prices

def fill_dummy_price_history():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Récupère tous les produits 'fixed_price'
    cursor.execute("SELECT product_id FROM product WHERE listing_type = 'fixed_price'")
    products = cursor.fetchall()

    # Définir la date de fin (ex. 24 février 2025) et la période (90 jours)
    end_date = datetime(2025, 2, 24)
    total_days = 90

    for product in products:
        product_id = product['product_id']
        
        # Récupérer le dernier prix réel de la table price_history
        cursor.execute("""
            SELECT price 
            FROM price_history
            WHERE product_id = %s
            ORDER BY date_scraped DESC
            LIMIT 1
        """, (product_id,))
        row = cursor.fetchone()

        if not row:
            print(f"[SKIP] Aucune donnée existante pour product_id={product_id}, on ne génère rien.")
            continue

        base_price_decimal = row['price']  # Décimal existant

        # Générer les 90 jours de prix
        dummy_prices = generate_smoother_prices(base_price_decimal, total_days)

        # On insère du plus ancien au plus récent
        # => day 0 = end_date - 89 jours, day 89 = end_date
        for i in range(total_days):
            day_offset = (total_days - 1) - i
            current_date = end_date - timedelta(days=day_offset)

            # Price = dummy_prices[i]
            # buy_it_now_price = identique pour un fixed_price
            price_value = dummy_prices[i]
            
            cursor.execute("""
                INSERT INTO price_history
                (product_id, price, buy_it_now_price, bids_count, time_remaining, date_scraped)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                product_id,
                price_value,
                price_value,
                None,  # bids_count non pertinent
                None,  # time_remaining non pertinent
                current_date.strftime("%Y-%m-%d %H:%M:%S")
            ))
        conn.commit()
        print(f"[OK] Produit {product_id}: {total_days} jours factices insérés.")

    cursor.close()
    conn.close()
    print("Remplissage de price_history terminé.")

if __name__ == "__main__":
    fill_dummy_price_history()
