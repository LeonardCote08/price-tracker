#!/usr/bin/env python3
import random
from decimal import Decimal
from datetime import datetime, timedelta
from core.db_connection import get_connection

def generate_weekly_prices(start_price: float, end_price: float, weeks: int) -> list[Decimal]:
    """
    Génère un tableau de prix pour 'weeks' semaines, 1 point par semaine.
      - On part de start_price pour aller (linéairement) vers end_price.
      - Variation ±0.3% max autour de la ligne théorique.
      - 30% de chances de garder le prix précédent (pour créer quelques “marches”).
    """
    if weeks < 2:
        # Si 1 seul point, on met direct start_price
        return [Decimal(str(round(start_price, 2)))]

    # Calcul du pas linéaire entre start_price et end_price
    step = (end_price - start_price) / (weeks - 1)

    prices = []
    for i in range(weeks):
        if i == 0:
            # Premier point = start_price ± petite variation
            var_pct = random.uniform(-0.003, 0.003)
            p = start_price * (1 + var_pct)
            prices.append(Decimal(str(round(p, 2))))
        else:
            # Valeur linéaire théorique pour ce point
            linear_target = start_price + (step * i)

            # 30% de chance de garder le prix précédent
            if random.random() < 0.30:
                prices.append(prices[-1])
            else:
                var_pct = random.uniform(-0.003, 0.003)
                p = linear_target * (1 + var_pct)
                prices.append(Decimal(str(round(p, 2))))

    return prices

def fill_dummy_price_history():
    """
    - Sélectionne tous les produits en 'fixed_price'.
    - Pour chacun, on supprime l'historique existant.
    - On génère 12 points (1/semaine) sur 12 semaines :
      * Soit tendance haussière (start < end),
      * Soit tendance baissière (start > end).
    - Les “base price” varient aléatoirement par produit, 
      ce qui augmente l'écart global entre les prix des différents produits.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Sélectionne tous les produits en fixed_price
    cursor.execute("SELECT product_id FROM product WHERE listing_type = 'fixed_price'")
    products = cursor.fetchall()

    nb_weeks = 12
    end_date = datetime(2025, 2, 24)

    for prod in products:
        product_id = prod["product_id"]

        # 1) Purge l'historique existant pour ce produit
        cursor.execute("DELETE FROM price_history WHERE product_id = %s", (product_id,))
        conn.commit()

        # 2) Détermine un "base" aléatoire pour ce produit
        #    (ex: entre 20$ et 60$)
        base_price = random.uniform(20, 60)

        # 3) Décide si on veut un produit "haussier" ou "baissier"
        #    (50% de chance each)
        is_upward = (random.random() < 0.5)

        if is_upward:
            # Ex : on va de (base_price - 3) → (base_price + 5)
            # (ça fait un écart de ~8$ pour bien voir la hausse)
            start_val = base_price - 3
            end_val   = base_price + 5
        else:
            # Tendance baissière
            # Ex : on va de (base_price + 5) → (base_price - 3)
            start_val = base_price + 5
            end_val   = base_price - 3

        # Génère 12 prix hebdo
        weekly_prices = generate_weekly_prices(start_val, end_val, nb_weeks)

        # 4) Insère chaque point du plus ancien (S-11) au plus récent (S0)
        for i in range(nb_weeks):
            weeks_offset = (nb_weeks - 1) - i
            current_date = end_date - timedelta(weeks=weeks_offset)

            date_str = current_date.strftime("%Y-%m-%d %H:%M:%S")
            price_value = weekly_prices[i]

            # Insertion
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
                date_str
            ))
        conn.commit()
        print(f"[OK] Produit {product_id}: 12 points ({'UP' if is_upward else 'DOWN'}).")

    cursor.close()
    conn.close()
    print("Terminé : historique factice créé avec des hausses et baisses variées.")

if __name__ == "__main__":
    fill_dummy_price_history()
