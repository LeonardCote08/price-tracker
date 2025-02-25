#!/usr/bin/env python3
import random
from datetime import datetime, timedelta
from core.db_connection import get_connection

def generate_fake_history(product_id, final_date_str, num_days=14):
    """
    G�n�re des donn�es factices pour la table price_history pour un produit fixed_price,
    sur une p�riode de num_days (la derni�re journ�e correspond aux vraies donn�es).
    
    :param product_id: L'identifiant du produit dans la table product.
    :param final_date_str: La date finale (ex. "2025-02-24") correspondant aux vraies donn�es.
    :param num_days: Nombre total de jours � simuler (ici, 14 jours).
    """
    # Conversion de la date finale
    final_date = datetime.strptime(final_date_str, "%Y-%m-%d")
    
    # Connexion � la base de donn�es
    conn = get_connection()
    cursor = conn.cursor()
    
    # R�cup�rer le prix r�el enregistr� le jour final
    query = """
    SELECT price FROM price_history
    WHERE product_id = %s AND DATE(date_scraped) = %s
    ORDER BY date_scraped DESC LIMIT 1
    """
    cursor.execute(query, (product_id, final_date_str))
    row = cursor.fetchone()
    if row is None:
        print("Aucune donn�e r�elle trouv�e pour la date finale.")
        cursor.close()
        conn.close()
        return
    final_price = row[0]
    print(f"Prix r�el du {final_date_str} : {final_price}$")
    
    # D�finir un prix de d�part pour 13 jours avant (en ajoutant une variation al�atoire de �5$)
    variation = random.uniform(-5, 5)
    starting_price = final_price + variation
    # S'assurer que le prix reste dans la plage [20, 60]
    starting_price = max(20, min(60, starting_price))
    print(f"Prix simul� de d�part (il y a {num_days-1} jours) : {starting_price}$")
    
    fake_data = []
    # On g�n�re les donn�es pour les jours pr�c�dents (du jour -13 au jour -1)
    for i in range(num_days - 1, 0, -1):
        # Calculer la date pour ce jour
        date_i = final_date - timedelta(days=i)
        # Calculer la fraction de progression (0 pour le jour de d�part, 1 pour le jour final)
        frac = (num_days - 1 - i) / (num_days - 1)
        # Prix de base par interpolation lin�aire
        base_price = starting_price + (final_price - starting_price) * frac
        # Ajouter un bruit al�atoire de �0.50$
        noise = random.uniform(-0.5, 0.5)
        fake_price = base_price + noise
        # S'assurer que le prix reste dans la plage [20, 60]
        fake_price = max(20, min(60, fake_price))
        
        # Pour un produit fixed_price, on met :
        # - buy_it_now_price = NULL (None en Python)
        # - bids_count = 0
        # - time_remaining = NULL (None)
        fake_data.append((product_id, fake_price, None, 0, None, date_i.strftime("%Y-%m-%d %H:%M:%S")))
    
    # Ins�rer les donn�es factices dans la table price_history
    insert_query = """
    INSERT INTO price_history (product_id, price, buy_it_now_price, bids_count, time_remaining, date_scraped)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    for record in fake_data:
        cursor.execute(insert_query, record)
    
    conn.commit()
    cursor.close()
    conn.close()
    print(f"Donn�es factices ins�r�es pour le produit {product_id} sur {num_days} jours.")

if __name__ == "__main__":
    # Remplacez par l'ID de votre produit Funko Pop Doctor Doom #561 dans la table product
    product_id = 1  # par exemple
    # Date finale correspondant aux vraies donn�es (24 f�vrier 2025)
    final_date_str = "2025-02-24"
    # G�n�re 14 jours de donn�es (13 jours factices + le jour r�el)
    generate_fake_history(product_id, final_date_str, num_days=14)
