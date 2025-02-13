from flask import Blueprint, render_template, request

web_bp = Blueprint('web', __name__, template_folder='templates')

@web_bp.route('/')
def index():
    return render_template('dashboard.html')

@web_bp.route('/callback')
def callback():
    """
    Endpoint appelé lorsque l'utilisateur accepte l'authentification via eBay.
    eBay renvoie un paramètre (généralement "code" pour OAuth) dans l'URL.
    Vous pouvez ici échanger ce code contre un token ou le traiter comme vous le souhaitez.
    """
    code = request.args.get('code')
    # Pour l'instant, affichons simplement le code dans la réponse.
    return f"Authentification acceptée. Code reçu: {code}"

@web_bp.route('/auth-declined')
def auth_declined():
    """
    Endpoint appelé lorsque l'utilisateur refuse l'authentification.
    """
    return "Authentification refusée par l'utilisateur."

@web_bp.route('/privacy')
def privacy():
    """
    Endpoint pour afficher votre politique de confidentialité.
    Vous pouvez renvoyer ici une page HTML ou simplement du texte.
    """
    return "Voici votre politique de confidentialité."
