#!/usr/bin/env python3
"""
Script pour mettre à jour le champ canonical_name dans la table product.
Ce script parcourt tous les produits, calcule un nom canonique à partir du titre,
et met à jour la base de données si nécessaire.

Vous pouvez adapter la fonction compute_canonical_name pour définir vos propres règles.
"""

from core.db_connection import get_connection

def compute_canonical_name(title):
    """
    Calcule le nom canonique à partir du titre complet.
    Par exemple, on peut choisir de prendre la partie avant la première virgule
    ou de tronquer à 60 caractères.
    
    Adaptez cette fonction selon vos règles.
    """
    if not title:
        return ""
    # Exemple 1 : si une virgule est présente, on prend la partie avant la virgule
    if ',' in title:
        return title.split(',')[0].strip()
    # Exemple 2 : sinon, on limite le titre à 60 caractères
    return title.strip()[:60]

def update_canonical_names():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Sélectionnez tous les produits (vous pouvez ajouter une clause WHERE si besoin)
    cursor.execute("SELECT product_id, title, canonical_name FROM product")
    products = cursor.fetchall()
    
    updated_count = 0
    for prod in products:
        current_canonical = prod.get("canonical_name")
        new_canonical = compute_canonical_name(prod["title"])
        # Vous pouvez décider de mettre à jour uniquement si le champ est vide ou différent
        if current_canonical != new_canonical:
            update_sql = "UPDATE product SET canonical_name = %s WHERE product_id = %s"
            cursor.execute(update_sql, (new_canonical, prod["product_id"]))
            updated_count += 1

    conn.commit()
    cursor.close()
    conn.close()
    print(f"Canonical names updated for {updated_count} products.")

if __name__ == '__main__':
    update_canonical_names()
