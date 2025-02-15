from flask import Flask
from api.api_routes import api_bp

app = Flask(__name__)

app.secret_key = "change_me_in_production"

# On enregistre uniquement le blueprint de l'API
app.register_blueprint(api_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
