from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    from .routes.predict import predict_bp
    from .routes.health import health_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(predict_bp, url_prefix="/api/ai")

    return app
