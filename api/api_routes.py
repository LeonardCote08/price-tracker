# api_routes.py
from flask import Blueprint, jsonify, request
from core.db_connection import get_connection
from core.category_mapping import extract_leaf_category

api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/produits', methods=['GET'])
def get_produits():
    """
    Retourne la liste de tous les produits.
    On récupère également :
      - normalized_condition (regroupe Brand New et New (Other) en "New")
      - signed (True si le titre contient "signed", sinon False)
      - in_box (indique si la figurine est dans sa boîte)
      - le dernier prix relevé via un sub-select
      - le nom de la catégorie via un LEFT JOIN sur la table category (leaf_name)
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.product_id,
               p.item_id,
               p.title,
               p.item_condition,
               p.normalized_condition,
               p.signed,
               p.in_box,
               p.url,
               p.image_url,
               p.seller_username,
               p.category,
               p.listing_type,
               p.bids_count,
               p.time_remaining,
               c.name AS leaf_name,
               (
                 SELECT ph.price
                 FROM price_history ph
                 WHERE ph.product_id = p.product_id
                 ORDER BY ph.date_scraped DESC
                 LIMIT 1
               ) AS last_price
        FROM product p
        LEFT JOIN category c ON p.category_id = c.category_id
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    result = []
    for row in rows:
        product_id           = row[0]
        item_id              = row[1]
        title                = row[2]
        item_condition       = row[3]
        normalized_condition = row[4]
        signed               = row[5]
        in_box               = row[6]
        url                  = row[7]
        image_url            = row[8]
        seller_username      = row[9]
        breadcrumb_cat       = row[10]  # ex: "Electronics > Video Games & Consoles > Video Games ..."
        listing_type         = row[11]
        bids_count           = row[12]
        time_remaining       = row[13]
        leaf_name            = row[14]  # La "leaf" de la catégorie depuis la table category
        last_price           = row[15]  # Dernier prix relevé

        # Extraction de la "leaf" de la catégorie (au cas où)
        cat_leaf = extract_leaf_category(breadcrumb_cat) if breadcrumb_cat else None

        result.append({
            "product_id": product_id,
            "item_id": item_id,
            "title": title,
            "item_condition": item_condition,
            "normalized_condition": normalized_condition,
            "signed": bool(signed),
            "in_box": in_box,  # Valeur du champ in_box
            "url": url,
            "image_url": image_url,
            "seller_username": seller_username,
            "category": cat_leaf,  # On utilise la "leaf" de la catégorie
            "leaf_category_name": leaf_name,
            "listing_type": listing_type,
            "bids_count": bids_count,
            "time_remaining": time_remaining,
            "price": float(last_price) if last_price is not None else None
        })

    return jsonify(result)

@api_bp.route('/produits/<int:product_id>', methods=['GET'])
def get_produit(product_id):
    """
    Retourne le détail d'un produit (un seul).
    Même logique que ci-dessus, on récupère également normalized_condition, signed et in_box.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.product_id,
               p.item_id,
               p.title,
               p.item_condition,
               p.normalized_condition,
               p.signed,
               p.in_box,
               p.url,
               p.image_url,
               p.seller_username,
               p.category,
               p.listing_type,
               p.bids_count,
               p.time_remaining,
               c.name AS leaf_name,
               (
                 SELECT ph.price
                 FROM price_history ph
                 WHERE ph.product_id = p.product_id
                 ORDER BY ph.date_scraped DESC
                 LIMIT 1
               ) AS last_price
        FROM product p
        LEFT JOIN category c ON p.category_id = c.category_id
        WHERE p.product_id = %s
    """, (product_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if row:
        product_id           = row[0]
        item_id              = row[1]
        title                = row[2]
        item_condition       = row[3]
        normalized_condition = row[4]
        signed               = row[5]
        in_box               = row[6]
        url                  = row[7]
        image_url            = row[8]
        seller_username      = row[9]
        breadcrumb_cat       = row[10]
        listing_type         = row[11]
        bids_count           = row[12]
        time_remaining       = row[13]
        leaf_name            = row[14]
        last_price           = row[15]

        cat_leaf = extract_leaf_category(breadcrumb_cat) if breadcrumb_cat else None

        result = {
            "product_id": product_id,
            "item_id": item_id,
            "title": title,
            "item_condition": item_condition,
            "normalized_condition": normalized_condition,
            "signed": bool(signed),
            "in_box": in_box,  # Valeur du champ in_box
            "url": url,
            "image_url": image_url,
            "seller_username": seller_username,
            "category": cat_leaf,  # On utilise la "leaf" de la catégorie
            "leaf_category_name": leaf_name,
            "listing_type": listing_type,
            "bids_count": bids_count,
            "time_remaining": time_remaining,
            "price": float(last_price) if last_price is not None else None
        }
        return jsonify(result)
    else:
        return jsonify({"error": "Produit non trouvé"}), 404

@api_bp.route('/produits/<int:product_id>/historique-prix', methods=['GET'])
def get_historique_prix(product_id):
    """
    Retourne l'historique de prix d'un produit, c'est-à-dire
    toutes les lignes de price_history associées à product_id.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT DATE_FORMAT(date_scraped, '%%Y-%%m-%%d') as date_scraped, price
        FROM price_history
        WHERE product_id = %s
        ORDER BY date_scraped ASC
    """, (product_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    data = {
        "dates": [row[0] for row in rows],
        "prices": [float(row[1]) for row in rows]
    }
    return jsonify(data)
