# api/api_routes.py
from flask import Blueprint, jsonify, request
from core.db_connection import get_connection
from core.category_mapping import extract_leaf_category

api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/produits', methods=['GET'])
def get_produits():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Récupérer le paramètre status dans la query string (valeurs possibles: active, ended)
    status_filter = request.args.get('status', None)
    where_clause = ""
    params = []
    if status_filter == 'active':
        where_clause = "WHERE p.ended = 0"
    elif status_filter == 'ended':
        where_clause = "WHERE p.ended = 1"

    query = f"""
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
               p.ended,
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
               ) AS last_price,
               (
                 SELECT DATE_FORMAT(MAX(ph.date_scraped), '%Y-%m-%d')
                 FROM price_history ph
                 WHERE ph.product_id = p.product_id
               ) AS last_scraped_date,
               p.buy_it_now_price
        FROM product p
        LEFT JOIN category c ON p.category_id = c.category_id
        {where_clause}
    """
    cursor.execute(query, params)
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
        in_box_val           = row[6]  # Valeur brute (0, 1, ou None)
        url                  = row[7]
        image_url            = row[8]
        seller_username      = row[9]
        ended                = row[10]
        listing_type         = row[12]
        bids_count           = row[13]
        time_remaining       = row[14]
        leaf_name            = row[15]
        last_price           = row[16]
        last_scraped_date    = row[17]
        buy_it_now_price     = row[18]

        # Conversion in_box : 0/1/None => bool ou None
        if in_box_val is None:
            in_box_bool = None
        else:
            in_box_bool = bool(in_box_val)

        result.append({
            "product_id": product_id,
            "item_id": item_id,
            "title": title,
            "item_condition": item_condition,
            "normalized_condition": normalized_condition,
            "signed": bool(signed),
            "in_box": in_box_bool,  # <-- On renvoie le booléen ou None
            "url": url,
            "image_url": image_url,
            "seller_username": seller_username,
            "ended": bool(ended),
            "listing_type": listing_type,
            "bids_count": bids_count,
            "time_remaining": time_remaining,
            "price": float(last_price) if last_price is not None else None,
            "last_scraped_date": last_scraped_date,
            "buy_it_now_price": float(buy_it_now_price) if buy_it_now_price is not None else None
        })

    return jsonify(result)

@api_bp.route('/produits/<int:product_id>', methods=['GET'])
def get_produit(product_id):
    """
    Retourne le détail d'un produit (un seul).
    On récupère également normalized_condition, signed, in_box, ended, etc.
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
               p.ended,
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
               ) AS last_price,
               (
                 SELECT DATE_FORMAT(MAX(ph.date_scraped), '%Y-%m-%d')
                 FROM price_history ph
                 WHERE ph.product_id = p.product_id
               ) AS last_scraped_date,
               p.buy_it_now_price
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
        in_box_val           = row[6]  # Valeur brute
        url                  = row[7]
        image_url            = row[8]
        seller_username      = row[9]
        ended                = row[10]
        listing_type         = row[12]
        bids_count           = row[13]
        time_remaining       = row[14]
        leaf_name            = row[15]
        last_price           = row[16]
        last_scraped_date    = row[17]
        buy_it_now_price     = row[18]

        # Conversion in_box : 0/1/None => bool ou None
        if in_box_val is None:
            in_box_bool = None
        else:
            in_box_bool = bool(in_box_val)

        result = {
            "product_id": product_id,
            "item_id": item_id,
            "title": title,
            "item_condition": item_condition,
            "normalized_condition": normalized_condition,
            "signed": bool(signed),
            "in_box": in_box_bool,
            "url": url,
            "image_url": image_url,
            "seller_username": seller_username,
            "ended": bool(ended),
            "listing_type": listing_type,
            "bids_count": bids_count,
            "time_remaining": time_remaining,
            "price": float(last_price) if last_price is not None else None,
            "last_scraped_date": last_scraped_date,
            "buy_it_now_price": float(buy_it_now_price) if buy_it_now_price is not None else None
        }
        return jsonify(result)
    else:
        return jsonify({"error": "Produit non trouvé"}), 404

@api_bp.route('/produits/<int:product_id>/price-trend', methods=['GET'])
def get_price_trend(product_id):
    """
    Retourne la tendance de prix d'un produit en comparant le premier et dernier prix.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Récupérer tous les prix triés par date
    cursor.execute("""
        SELECT price 
        FROM price_history 
        WHERE product_id = %s 
        ORDER BY date_scraped ASC
    """, (product_id,))
    
    prices = cursor.fetchall()
    cursor.close()
    conn.close()

    if len(prices) < 2:
        return jsonify({"trend": "stable"})  # Pas assez de données, on assume stable

    first_price = prices[0][0]
    last_price = prices[-1][0]
    
    # Calculer le pourcentage de variation
    if first_price > 0:
        variation = ((last_price - first_price) / first_price) * 100
    else:
        variation = 0
    
    # Utiliser un seuil de ±3% pour considérer une variation comme significative
    if variation > 3:
        trend = "up"
    elif variation < -3:
        trend = "down"
    else:
        trend = "stable"
        
    return jsonify({
        "trend": trend,
        "variation": variation
    })

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

    prices = [float(row[1]) for row in rows]
    dates = [row[0] for row in rows]
    if not prices:
        return jsonify({"dates": [], "prices": [], "stats": {}, "trend": "N/A"})

    # Statistiques avancées
    avg_price = sum(prices) / len(prices)
    min_price = min(prices)
    max_price = max(prices)
    
    # Calculer la variation en pourcentage entre le premier et le dernier prix
    variation = ((prices[-1] - prices[0]) / prices[0] * 100) if prices[0] != 0 else 0
    
    seven_day_avg = sum(prices[-7:]) / min(len(prices), 7) if prices else 0
    
    # Déterminer la tendance en fonction de la variation
    if variation > 3:
        trend = "up"
    elif variation < -3:
        trend = "down"
    else:
        trend = "stable"

    data = {
        "dates": dates,
        "prices": prices,
        "stats": {
            "avg_price": avg_price,
            "min_price": min_price,
            "max_price": max_price,
            "variation": variation,
            "seven_day_avg": seven_day_avg
        },
        "trend": trend
    }
    return jsonify(data)