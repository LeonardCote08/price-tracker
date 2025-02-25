#!/usr/bin/env python3
import random
from decimal import Decimal
from datetime import datetime, timedelta
from core.db_connection import get_connection

def generate_weekly_prices(base_price: float, weeks: int):
    """
    Génère un tableau de prix pour 'weeks' semaines, 1 point par semaine.
      - Tendance linéaire de (base_price - 1$) à (base_price + 2$).
      - Variation journalière +/- 0.3% max autour de la tendance.
      - 50% de chances de garder exactement le prix précédent (pour de légères “marches”).
    """
    start_price = base_price - 1.0
    end_price   = base_price + 2.0

    if weeks > 1:
        step_increase = (end_price - start_price) / (weeks - 1)
    else:
        step_increase = 0

    prices = []
    for i in range(weeks):
        if i == 0:
            # Premier point
            variation_percent = random.uniform(-0.003, 0.003)
            p = start_price * (1 + variation_percent)
            prices.append(Decimal(str(round(p, 2))))
        else:
            # Prix linéaire théorique ce “i”-ème point
            linear_target = start_price + (step_increase * i)
            if random.random() < 0.50:
                # 50% de chance de garder le prix précédent
                prices.append(prices[-1])
            else:
                variation_percent = random.uniform(-0.003, 0.003)
                p = linear_target * (1 + variation_percent)
                prices.append(Decimal(str(round(p, 2))))

    return prices

def fill_dummy_price_history():
    """
    - Sélectionne tous les produits en 'fixed_price'.
    - Pour chacun, on supprime l'ancien historique (pour éviter la surcharge de points).
    - On génère 12 points (12 semaines) du plus ancien au plus récent.
    - On insère 1 point/semaine : courbe plus lisible.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Sélectionne tous les produits en fixed_price
    cursor.execute("SELECT product_id FROM product WHERE listing_type = 'fixed_price'")
    products = cursor.fetchall()

    # Paramètres
    nb_weeks = 12                      # 12 points (12 semaines)
    end_date = datetime(2025, 2, 24)   # date de fin fictive
    base_price = 35.0                  # “prix moyen” de départ

    for prod in products:
        product_id = prod["product_id"]

        # 1) Supprimer tout l'historique existant pour ce produit
        cursor.execute("DELETE FROM price_history WHERE product_id = %s", (product_id,))
        conn.commit()

        # 2) Génère 12 prix (un par semaine)
        weekly_prices = generate_weekly_prices(base_price, nb_weeks)

        # 3) Insère chaque point du plus ancien (S-11) au plus récent (S0)
        #    => Semaine i = end_date - (nb_weeks - 1 - i)*7 jours
        for i in range(nb_weeks):
            # Ex: i=0 => le plus ancien
            weeks_offset = (nb_weeks - 1) - i
            current_date = end_date - timedelta(weeks=weeks_offset)

            # Format date
            date_str = current_date.strftime("%Y-%m-%d %H:%M:%S")
            price_value = weekly_prices[i]

            # Insert 1 point
            cursor.execute("""
                INSERT INTO price_history
                  (product_id, price, buy_it_now_price, bids_count, time_remaining, date_scraped)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                product_id,
                price_value,
                price_value,  # buy_it_now_price identique pour du fixed_price
                None,         # pas d'enchères
                None,         # pas de time_remaining
                date_str
            ))
        conn.commit()

        print(f"[OK] Produit {product_id}: {nb_weeks} points insérés (1/semaine).")

    cursor.close()
    conn.close()
    print("Terminé : historique factice (12 points/semaine) créé avec succès.")

if __name__ == "__main__":
    fill_dummy_price_history()
