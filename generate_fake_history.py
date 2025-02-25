#!/usr/bin/env python3
import os
import random
from datetime import datetime, timedelta
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

# Paramètres de connexion à la base de données
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "price_tracker_us")

# Connexion à la base de données
conn = mysql.connector.connect(
    host=DB_HOST,
    port=DB_PORT,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME,
    charset='utf8mb4'
)
cursor = conn.cursor()

# On sélectionne les produits en fixed_price
cursor.execute("SELECT product_id FROM product WHERE listing_type = 'fixed_price'")
products = cursor.fetchall()

# Paramètres de simulation
num_days = 90  # 90 scrapes, soit 3 mois
# Date finale (les données réelles) = 24 février 2025
end_date = datetime(2025, 2, 24)
start_date = end_date - timedelta(days=num_days - 1)

# Pour chaque produit, générer 90 enregistrements factices
for (product_id,) in products:
    # Récupérer le dernier prix réel pour ce produit
    cursor.execute("""
        SELECT price 
        FROM price_history 
        WHERE product_id = %s 
        ORDER BY date_scraped DESC 
        LIMIT 1
    """, (product_id,))
    result = cursor.fetchone()
    if result:
        final_price = float(result[0])
    else:
        continue  # Si aucun prix n'est trouvé, passer au produit suivant

    # Générer un prix de départ fictif.
    # Par exemple, on peut supposer une variation globale entre -5% et +5%
    overall_variation = random.uniform(-5, 5)  # en pourcentage
    starting_price = final_price / (1 + overall_variation / 100)

    # Pour chaque jour de la période, interpoler linéairement et ajouter un bruit aléatoire (±1%)
    for i in range(num_days):
        current_date = start_date + timedelta(days=i)
        # Interpolation linéaire
        base_price = starting_price + (final_price - starting_price) * (i / (num_days - 1))
        # Ajout d'un bruit aléatoire de ±1%
        noise = random.uniform(-0.01, 0.01)
        fake_price = round(base_price * (1 + noise), 2)
        # Pour un produit fixed_price, on peut considérer que buy_it_now_price = price
        buy_it_now_price = fake_price
        # Pour fixed_price, pas de bids_count et de time_remaining
        bids_count = None
        time_remaining = None

        # Générer une date_scraped avec une heure aléatoire dans la journée
        random_time = timedelta(
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
            seconds=random.randint(0, 59)
        )
        date_scraped = current_date + random_time

        # Insérer la donnée factice dans la table price_history
        insert_query = """
            INSERT INTO price_history (product_id, price, buy_it_now_price, bids_count, time_remaining, date_scraped)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (product_id, fake_price, buy_it_now_price, bids_count, time_remaining, date_scraped))
    conn.commit()
    print(f"Fake price history inserted for product {product_id}")

cursor.close()
conn.close()
