# app.py
from flask import Flask
from scrapers.routes import web_bp  # Blueprint pour l'interface web

# On indique à Flask où se trouvent les templates :
app = Flask(__name__,
            template_folder='web/templates',
            static_folder='web/static')


app.secret_key = "change_me_in_production"

app.register_blueprint(web_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)