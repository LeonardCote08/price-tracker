#!/usr/bin/env python3
import random
from datetime import datetime, timedelta
from core.db_connection import get_connection

def generate_fake_history(product_id, final_date_str, num_days=14):
    """
    Génère des données factices pour la table price_history pour un produit fixed_price,
    sur une période de num_days (la dernière journée correspond aux vraies données).
    
    :param product_id: L'identifiant du produit dans la table product.
    :param final_date_str: La date finale (ex. "2025-02-24") correspondant aux vraies données.
    :param num_days: Nombre total de jours à simuler (ici, 14 jours).
    """
    # Conversion de la date finale
    final_date = datetime.strptime(final_date_str, "%Y-%m-%d")
    
    # Connexion à la base de données
    conn = get_connection()
    cursor = conn.cursor()
    
    # Récupérer le prix réel enregistré le jour final
    query = """
    SELECT price FROM price_history
    WHERE product_id = %s AND DATE(date_scraped) = %s
    ORDER BY date_scraped DESC LIMIT 1
    """
    cursor.execute(query, (product_id, final_date_str))
    row = cursor.fetchone()
    if row is None:
        print("Aucune donnée réelle trouvée pour la date finale.")
        cursor.close()
        conn.close()
        return
    final_price = row[0]
    print(f"Prix réel du {final_date_str} : {final_price}$")
    
    # Définir un prix de départ pour 13 jours avant (en ajoutant une variation aléatoire de ±5$)
    variation = random.uniform(-5, 5)
    starting_price = float(final_price) + variation
    # S'assurer que le prix reste dans la plage [20, 60]
    starting_price = max(20, min(60, starting_price))
    print(f"Prix simulé de départ (il y a {num_days-1} jours) : {starting_price}$")
    
    fake_data = []
    # On génère les données pour les jours précédents (du jour -13 au jour -1)
    for i in range(num_days - 1, 0, -1):
        # Calculer la date pour ce jour
        date_i = final_date - timedelta(days=i)
        # Calculer la fraction de progression (0 pour le jour de départ, 1 pour le jour final)
        frac = (num_days - 1 - i) / (num_days - 1)
        # Prix de base par interpolation linéaire
        base_price = starting_price + (float(final_price) - starting_price) * frac
        # Ajouter un bruit aléatoire de ±0.50$
        noise = random.uniform(-0.5, 0.5)
        fake_price = base_price + noise
        # S'assurer que le prix reste dans la plage [20, 60]
        fake_price = max(20, min(60, fake_price))
        
        # Pour un produit fixed_price, on met :
        # - buy_it_now_price = NULL (None en Python)
        # - bids_count = 0
        # - time_remaining = NULL (None)
        fake_data.append((product_id, fake_price, None, 0, None, date_i.strftime("%Y-%m-%d %H:%M:%S")))
    
    # Insérer les données factices dans la table price_history
    insert_query = """
    INSERT INTO price_history (product_id, price, buy_it_now_price, bids_count, time_remaining, date_scraped)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    for record in fake_data:
        cursor.execute(insert_query, record)
    
    conn.commit()
    cursor.close()
    conn.close()
    print(f"Données factices insérées pour le produit {product_id} sur {num_days} jours.")

if __name__ == "__main__":
    # Remplacez par l'ID de votre produit Funko Pop Doctor Doom #561 dans la table product
    product_id = 1  # par exemple
    # Date finale correspondant aux vraies données (24 février 2025)
    final_date_str = "2025-02-24"
    # Génère 14 jours de données (13 jours factices + le jour réel)
    generate_fake_history(product_id, final_date_str, num_days=14)
