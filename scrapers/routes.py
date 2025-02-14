# scrapers/routes.py

from flask import Blueprint, render_template, request
from core.db_connection import get_connection

web_bp = Blueprint('web', __name__)


@web_bp.route('/')
def index():
    """
    Page d'accueil, renvoie le template index.html.
    """
    return render_template('index.html')

@web_bp.route('/products')
def products_list():
    from core.db_connection import get_connection
    conn = get_connection()
    cursor = conn.cursor()
    # Récupère l'ID et le titre des produits
    cursor.execute("SELECT product_id, title FROM product")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('products.html', products=rows)


@web_bp.route('/dashboard/<int:product_id>')
def dashboard(product_id):
    """
    Affiche l'historique des prix d'un produit spécifique.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Récupérer l'historique de prix pour le produit, trié par date croissante
    sql = """
        SELECT DATE_FORMAT(date_scraped, '%Y-%m-%d') as date_scraped, price
        FROM price_history
        WHERE product_id = %s
        ORDER BY date_scraped ASC
    """
    cursor.execute(sql, (product_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # Séparer les dates et les prix dans des listes
    dates = [row[0] for row in rows]
    prices = [float(row[1]) for row in rows]
    
    # Calculer quelques statistiques (exemple : prix min, max, moyenne)
    if prices:
        min_price = min(prices)
        max_price = max(prices)
        avg_price = sum(prices) / len(prices)
    else:
        min_price = max_price = avg_price = 0
    
    return render_template(
        'dashboard.html',
        product_id=product_id,
        dates=dates,
        prices=prices,
        min_price=min_price,
        max_price=max_price,
        avg_price=avg_price
    )
