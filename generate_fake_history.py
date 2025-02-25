#!/usr/bin/env python3
import random
from decimal import Decimal
from datetime import datetime, timedelta
from core.db_connection import get_connection

def generate_smoother_prices(base_price: float, days: int):
    """
    Génère un tableau de prix 'lisses' sur 'days' jours.
      - Tendance linéaire de (base_price - 1$) à (base_price + 2$).
      - Variation journalière +/- 0.3% max autour de la tendance.
      - 60% de chances de conserver le prix de la veille (pas de changement).
    """
    trend_start = base_price - 1.0
    trend_end   = base_price + 2.0

    if days > 1:
        daily_increase = (trend_end - trend_start) / (days - 1)
    else:
        daily_increase = 0

    prices = []
    for i in range(days):
        if i == 0:
            # Premier jour : on part de trend_start, légère fluctuation
            variation_percent = random.uniform(-0.003, 0.003)
            final_price = trend_start * (1 + variation_percent)
            prices.append(Decimal(str(round(final_price, 2))))
        else:
            # Prix linéaire théorique ce jour
            linear_price = trend_start + (daily_increase * i)

            # 60% de chance de garder le même prix
            if random.random() < 0.60:
                final_price_dec = prices[-1]
            else:
                variation_percent = random.uniform(-0.003, 0.003)
                final_price = linear_price * (1 + variation_percent)
                final_price_dec = Decimal(str(round(final_price, 2)))

            prices.append(final_price_dec)

    return prices

def fill_dummy_price_history():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Sélectionne uniquement les produits "fixed_price"
    cursor.execute("SELECT product_id FROM product WHERE listing_type = 'fixed_price'")
    products = cursor.fetchall()

    # Paramètres
    end_date = datetime(2025, 2, 24)  # Date de fin fictive
    total_days = 90                   # Nombre de jours d'historique
    base_price = 35.0                 # Prix de base (exemple)

    for prod in products:
        product_id = prod['product_id']

        # 1) On supprime toutes les anciennes entrées (évite d’empiler)
        cursor.execute("DELETE FROM price_history WHERE product_id = %s", (product_id,))
        conn.commit()

        # 2) Génère la liste de prix sur 'total_days'
        dummy_prices = generate_smoother_prices(base_price, total_days)

        # 3) Insère un seul point par jour
        for i in range(total_days):
            day_offset = (total_days - 1) - i
            current_date = end_date - timedelta(days=day_offset)

            date_str = current_date.strftime("%Y-%m-%d %H:%M:%S")
            price_value = dummy_prices[i]

            cursor.execute("""
                INSERT INTO price_history
                (product_id, price, buy_it_now_price, bids_count, time_remaining, date_scraped)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                product_id,
                price_value,
                price_value,  # buy_it_now_price = idem pour fixed_price
                None,         # pas d'enchères
                None,         # pas de time_remaining
                date_str
            ))
        conn.commit()
        print(f"[OK] Produit {product_id} : {total_days} jours insérés (base={base_price}).")

    cursor.close()
    conn.close()
    print("Terminé : historique factice créé avec succès.")

if __name__ == "__main__":
    fill_dummy_price_history()
