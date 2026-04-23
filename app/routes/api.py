import os

from flask import Blueprint, current_app, jsonify, request

from ..services.product_service import ProductService
from ..supabase import SupabaseConfigError

api_bp = Blueprint("api", __name__)


def _service() -> ProductService:
    return ProductService()


def _telegram_config() -> dict:
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    channel_id = os.getenv("TELEGRAM_CHANNEL_ID", "").strip()
    webhook_url = os.getenv("TELEGRAM_WEBHOOK_URL", "").strip()
    return {
        "hasBotToken": bool(bot_token),
        "hasChannelId": bool(channel_id),
        "webhookUrl": webhook_url or "https://your-server.com/webhook",
    }


@api_bp.get("/config")
def get_config():
    return jsonify({"telegram": _telegram_config()})


@api_bp.get("/products")
def list_products():
    try:
        return jsonify(_service().list_products())
    except SupabaseConfigError as exc:
        current_app.logger.exception("Supabase config error while listing products")
        return jsonify({"message": str(exc)}), 500
    except Exception as exc:
        current_app.logger.exception("Unexpected error while listing products")
        return jsonify({"message": str(exc)}), 500


@api_bp.post("/products")
def create_product():
    form_data = request.form.to_dict()
    uploaded_files = request.files.getlist("images")
    try:
        product = _service().create_product(form_data, uploaded_files)
    except (ValueError, SupabaseConfigError) as exc:
        current_app.logger.exception("Product creation failed")
        return jsonify({"message": str(exc)}), 400
    except Exception as exc:
        current_app.logger.exception("Unexpected error while creating product")
        return jsonify({"message": str(exc)}), 400
    return jsonify(product), 201


@api_bp.put("/products/<product_id>")
def update_product(product_id: str):
    form_data = request.form.to_dict()
    uploaded_files = request.files.getlist("images")
    try:
        product = _service().update_product(product_id, form_data, uploaded_files)
    except (ValueError, SupabaseConfigError) as exc:
        current_app.logger.exception("Product update failed for %s", product_id)
        return jsonify({"message": str(exc)}), 400
    except Exception as exc:
        current_app.logger.exception("Unexpected error while updating product %s", product_id)
        return jsonify({"message": str(exc)}), 400
    if not product:
        return jsonify({"message": "Product not found"}), 404
    return jsonify(product)


@api_bp.delete("/products/<product_id>")
def delete_product(product_id: str):
    try:
        removed = _service().delete_product(product_id)
    except SupabaseConfigError as exc:
        current_app.logger.exception("Supabase config error while deleting product %s", product_id)
        return jsonify({"message": str(exc)}), 400
    except Exception as exc:
        current_app.logger.exception("Unexpected error while deleting product %s", product_id)
        return jsonify({"message": str(exc)}), 400
    if not removed:
        return jsonify({"message": "Product not found"}), 404
    return jsonify({"ok": True})


@api_bp.post("/telegram/webhook")
def save_webhook():
    return jsonify(
        {
            "ok": True,
            "message": "Webhook konfiguratsiyasi .env orqali boshqariladi.",
            "url": _telegram_config()["webhookUrl"],
        }
    )


@api_bp.post("/client-log")
def client_log():
    payload = request.get_json(silent=True) or {}
    level = str(payload.get("level", "error")).lower()
    message = payload.get("message", "Client-side log")
    context = payload.get("context")

    if level == "warning":
        current_app.logger.warning("Client log: %s | context=%s", message, context)
    else:
        current_app.logger.error("Client log: %s | context=%s", message, context)

    return jsonify({"ok": True})
