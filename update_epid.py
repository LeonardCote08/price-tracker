#!/usr/bin/env python3
import urllib.parse
from core.db_connection import get_connection

def extract_epid(url):
    """
    Extrait la valeur du paramètre 'epid' à partir de l'URL.
    Retourne None si le paramètre n'est pas présent.
    """
    parsed_url = urllib.parse.urlparse(url)
    query_params = urllib.parse.parse_qs(parsed_url.query)
    epid_values = query_params.get("epid")
    if epid_values:
        # Retourner la première valeur trouvée
        return epid_values[0].strip()
    return None

def main():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Sélectionner les produits dont le champ epid est NULL ou vide
    cursor.execute("SELECT product_id, url FROM product WHERE epid IS NULL OR epid = ''")
    products = cursor.fetchall()
    
    if not products:
        print("Tous les produits ont déjà un EPID renseigné.")
        return

    updated_count = 0
    for product in products:
        epid = extract_epid(product["url"])
        if epid:
            cursor.execute("UPDATE product SET epid = %s WHERE product_id = %s", (epid, product["product_id"]))
            conn.commit()
            print(f"Produit {product['product_id']} mis à jour avec epid : {epid}")
            updated_count += 1
        else:
            print(f"Produit {product['product_id']} : aucun epid trouvé dans l'URL.")
    
    cursor.close()
    conn.close()
    print(f"Mise à jour terminée pour {updated_count} produits.")

if __name__ == "__main__":
    main()
