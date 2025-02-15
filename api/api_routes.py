# api_routes.py
from flask import Blueprint, jsonify, request
from core.db_connection import get_connection

api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/produits', methods=['GET'])
def get_produits():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.product_id,
               p.item_id,
               p.title,
               p.item_condition,
               p.url,
               p.image_url,
               p.shipping_cost,
               p.seller_username,
               p.category,
               (
                 SELECT ph.price
                 FROM price_history ph
                 WHERE ph.product_id = p.product_id
                 ORDER BY ph.date_scraped DESC
                 LIMIT 1
               ) AS last_price
        FROM product p
    """)
    produits = cursor.fetchall()
    cursor.close()
    conn.close()
    result = [{
        "product_id": p[0],
        "item_id": p[1],
        "title": p[2],
        "item_condition": p[3],
        "url": p[4],
        "image_url": p[5],
        "shipping_cost": float(p[6]) if p[6] is not None else None,
        "seller_username": p[7],
        "category": p[8],
        "price": float(p[9]) if p[9] is not None else None
    } for p in produits]
    return jsonify(result)

@api_bp.route('/produits/<int:product_id>', methods=['GET'])
def get_produit(product_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.product_id,
               p.item_id,
               p.title,
               p.item_condition,
               p.url,
               p.image_url,
               p.shipping_cost,
               p.seller_username,
               p.category,
               (
                 SELECT ph.price
                 FROM price_history ph
                 WHERE ph.product_id = p.product_id
                 ORDER BY ph.date_scraped DESC
                 LIMIT 1
               ) AS last_price
        FROM product p
        WHERE p.product_id = %s
    """, (product_id,))
    produit = cursor.fetchone()
    cursor.close()
    conn.close()
    if produit:
        result = {
            "product_id": produit[0],
            "item_id": produit[1],
            "title": produit[2],
            "item_condition": produit[3],
            "url": produit[4],
            "image_url": produit[5],
            "shipping_cost": float(produit[6]) if produit[6] is not None else None,
            "seller_username": produit[7],
            "category": produit[8],
            "price": float(produit[9]) if produit[9] is not None else None
        }
        return jsonify(result)
    else:
        return jsonify({"error": "Produit non trouvé"}), 404

@api_bp.route('/produits/<int:product_id>/historique-prix', methods=['GET'])
def get_historique_prix(product_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT DATE_FORMAT(date_scraped, '%Y-%m-%d') as date_scraped, price
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
