import logging

from flask import Flask
from dotenv import load_dotenv

from .routes.api import api_bp
from .routes.views import views_bp
from .supabase import SupabaseConfigError, initialize_supabase


def create_app() -> Flask:
    load_dotenv()

    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
    app.logger.setLevel(logging.INFO)

    try:
        initialize_supabase(app)
        app.config["SUPABASE_CONFIG_ERROR"] = None
    except SupabaseConfigError as exc:
        app.config["SUPABASE_CONFIG_ERROR"] = str(exc)
        app.logger.exception("Supabase initialization failed")

    app.register_blueprint(views_bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    return app
