#!/usr/bin/env python3
import random
from decimal import Decimal
from datetime import datetime, timedelta
from core.db_connection import get_connection

def generate_smoother_prices(base_price_decimal, days):
    """
    Génère une courbe de prix douce :
      - Tendance linéaire de (base_price - 1$) à (base_price + 2$) sur 'days' jours.
      - Variation journalière +/- 0.3% max autour de la tendance.
      - 60% de chances de conserver le prix de la veille (pas de changement).
    """
    base_price_float = float(base_price_decimal)
    
    # On part d'environ base_price - 1 jusqu'à base_price + 2
    trend_start = base_price_float - 1.0
    trend_end   = base_price_float + 2.0
    if days > 1:
        daily_increase = (trend_end - trend_start) / (days - 1)
    else:
        daily_increase = 0
    
    prices = []
    for i in range(days):
        if i == 0:
            # Premier jour : on part de trend_start
            linear_price = trend_start
            # Petite variation
            variation_percent = random.uniform(-0.003, 0.003)
            final_price = linear_price * (1 + variation_percent)
            final_price_dec = Decimal(str(round(final_price, 2)))
            prices.append(final_price_dec)
        else:
            # Calcul linéaire pur pour ce jour
            linear_price = trend_start + (daily_increase * i)
            # Déterminer si on met à jour ou pas (60% de chance de garder le même prix)
            if random.random() < 0.60:
                # On garde le même prix que la veille
                final_price_dec = prices[-1]
            else:
                # On calcule la nouvelle valeur (tendance + petite variation)
                variation_percent = random.uniform(-0.003, 0.003)
                final_price = linear_price * (1 + variation_percent)
                final_price_dec = Decimal(str(round(final_price, 2)))
            
            prices.append(final_price_dec)

    return prices

def fill_dummy_price_history():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Récupère tous les produits en 'fixed_price'
    cursor.execute("SELECT product_id FROM product WHERE listing_type = 'fixed_price'")
    products = cursor.fetchall()

    # Paramètres : 90 jours, date de fin 24 février 2025
    end_date = datetime(2025, 2, 24)
    total_days = 90

    for product in products:
        product_id = product['product_id']
        
        # Récupérer le dernier prix réel (ou un prix existant) pour ce produit
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

        base_price_decimal = row['price']  # type Decimal

        # Générer les prix factices
        dummy_prices = generate_smoother_prices(base_price_decimal, total_days)

        # Insérer du plus ancien (J-89) au plus récent (J0 = end_date)
        for i in range(total_days):
            day_offset = (total_days - 1) - i
            current_date = end_date - timedelta(days=day_offset)

            price_value = dummy_prices[i]

            # On vérifie d'abord si, pour cette date (au format jour) et ce prix, 
            # il n'y a pas déjà un enregistrement.
            date_str = current_date.strftime("%Y-%m-%d")  # Jour (YYYY-MM-DD)
            full_datetime_str = current_date.strftime("%Y-%m-%d %H:%M:%S")

            cursor.execute("""
                SELECT price
                FROM price_history
                WHERE product_id = %s
                  AND DATE(date_scraped) = %s
                ORDER BY date_scraped DESC
                LIMIT 1
            """, (product_id, date_str))
            existing_row = cursor.fetchone()

            if existing_row:
                last_price_that_day = existing_row['price']
                # Si le prix du jour est identique, on skip
                if float(last_price_that_day) == float(price_value):
                    # On évite d'insérer un doublon "même jour / même prix"
                    continue

            # Sinon, on insère
            cursor.execute("""
                INSERT INTO price_history
                (product_id, price, buy_it_now_price, bids_count, time_remaining, date_scraped)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                product_id,
                price_value,
                price_value,  # buy_it_now_price = identique en fixed_price
                None,         # pas d'enchères
                None,         # pas de time_remaining
                full_datetime_str
            ))
        conn.commit()
        print(f"[OK] Produit {product_id}: {total_days} jours factices insérés (avec skip si doublon).")

    cursor.close()
    conn.close()
    print("Remplissage de price_history terminé.")

if __name__ == "__main__":
    fill_dummy_price_history()
