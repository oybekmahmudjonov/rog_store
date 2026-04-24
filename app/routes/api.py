import os
import json
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request

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


def _telegram_api_call(method: str, payload: dict) -> dict:
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not bot_token:
        raise ValueError("TELEGRAM_BOT_TOKEN is missing in .env")

    encoded = urllib_parse.urlencode(payload).encode("utf-8")
    req = urllib_request.Request(
        f"https://api.telegram.org/bot{bot_token}/{method}",
        data=encoded,
        method="POST",
    )
    req.add_header("Content-Type", "application/x-www-form-urlencoded")

    with urllib_request.urlopen(req, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


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


@api_bp.patch("/products/<product_id>/favorite")
def favorite_product(product_id: str):
    payload = request.get_json(silent=True) or {}
    is_favorite = bool(payload.get("isFavorite"))
    try:
        product = _service().set_favorite(product_id, is_favorite)
    except SupabaseConfigError as exc:
        current_app.logger.exception("Supabase config error while updating favorite for product %s", product_id)
        return jsonify({"message": str(exc)}), 400
    except Exception as exc:
        current_app.logger.exception("Unexpected error while updating favorite for product %s", product_id)
        return jsonify({"message": str(exc)}), 400
    if not product:
        return jsonify({"message": "Product not found"}), 404
    return jsonify(product)


@api_bp.post("/telegram/connect-webhook")
def save_webhook():
    webhook_url = _telegram_config()["webhookUrl"]
    if not webhook_url:
        return jsonify({"message": "TELEGRAM_WEBHOOK_URL is missing in .env"}), 400

    try:
        telegram_response = _telegram_api_call("setWebhook", {"url": webhook_url})
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    except urllib_error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        current_app.logger.exception("Telegram setWebhook HTTP error")
        return jsonify({"message": body or f"Telegram HTTP error {exc.code}"}), 400
    except Exception as exc:
        current_app.logger.exception("Unexpected error while connecting Telegram webhook")
        return jsonify({"message": str(exc)}), 400

    if not telegram_response.get("ok"):
        return jsonify({"message": telegram_response.get("description", "Telegram webhook connection failed")}), 400

    current_app.logger.info("Telegram webhook connected to %s", webhook_url)
    return jsonify(
        {
            "ok": True,
            "message": "Webhook connected",
            "url": webhook_url,
            "telegram": telegram_response,
        }
    )


@api_bp.post("/telegram/webhook")
def telegram_webhook():
    payload = request.get_json(silent=True) or {}
    current_app.logger.info("Telegram webhook update received: %s", payload)
    return jsonify({"ok": True})


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
