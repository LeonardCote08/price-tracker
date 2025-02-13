from flask import Flask
from web.routes import web_bp  # Blueprint pour l'interface web
from api.routes import api_bp  # Blueprint pour l'API

app = Flask(__name__)
app.secret_key = "change_me_in_production"  # À sécuriser en production

# Enregistrement des blueprints
app.register_blueprint(web_bp)           # Pour l'interface web
app.register_blueprint(api_bp, url_prefix='/api')  # Les endpoints API seront accessibles sous /api

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
