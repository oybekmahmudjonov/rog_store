import os
import re
import uuid
from typing import Iterable

from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from ..supabase import create_s3_client, create_supabase_client


class ProductService:
    def __init__(self):
        self.client = create_supabase_client()
        self.s3 = create_s3_client()
        self.table_name = os.getenv("SUPABASE_PRODUCTS_TABLE", "laptops")
        self.bucket_name = os.getenv("SUPABASE_BUCKET", "").strip()
        self.signed_url_expiry = int(os.getenv("SUPABASE_SIGNED_URL_EXPIRY", "604800"))

    def list_products(self) -> list[dict]:
        response = (
            self.client.table(self.table_name)
            .select("*")
            .order("is_favorite", desc=True)
            .order("created_at", desc=True)
            .execute()
        )
        return [self._serialize_row(row) for row in response.data or []]

    def create_product(self, form_data: dict, uploaded_files: Iterable[FileStorage]) -> dict:
        row = self._build_row(form_data, uploaded_files)
        response = self.client.table(self.table_name).insert(row).execute()
        created_row = (response.data or [row])[0]
        return self._serialize_row(created_row)

    def update_product(self, product_id: str, form_data: dict, uploaded_files: Iterable[FileStorage]) -> dict | None:
        existing = self._get_raw_row(product_id)
        if not existing:
            return None

        removed_image_paths = self._split_csv(form_data.get("removedImagePaths", "").strip())
        row = self._build_row(
            form_data,
            uploaded_files,
            existing=existing,
            removed_image_paths=removed_image_paths,
        )
        response = self.client.table(self.table_name).update(row).eq("id", product_id).execute()
        updated_row = (response.data or [None])[0]
        return self._serialize_row(updated_row) if updated_row else None

    def delete_product(self, product_id: str) -> bool:
        existing = self._get_raw_row(product_id)
        if not existing:
            return False

        for object_path in existing.get("image_paths") or []:
            self.s3.delete_object(Bucket=self.bucket_name, Key=object_path)

        self.client.table(self.table_name).delete().eq("id", product_id).execute()
        return True

    def set_favorite(self, product_id: str, is_favorite: bool) -> dict | None:
        response = (
            self.client.table(self.table_name)
            .update({"is_favorite": is_favorite})
            .eq("id", product_id)
            .execute()
        )
        updated_row = (response.data or [None])[0]
        return self._serialize_row(updated_row) if updated_row else None

    def _get_raw_row(self, product_id: str) -> dict | None:
        response = self.client.table(self.table_name).select("*").eq("id", product_id).limit(1).execute()
        return (response.data or [None])[0]

    def _build_row(
        self,
        form_data: dict,
        uploaded_files: Iterable[FileStorage],
        existing: dict | None = None,
        removed_image_paths: list[str] | None = None,
    ) -> dict:
        name = form_data.get("name", "").strip()
        price_raw = form_data.get("price", "").strip()
        if not name or not price_raw:
            raise ValueError("Name and price are required")

        try:
            price = float(price_raw)
        except ValueError as exc:
            raise ValueError("Price must be a number") from exc

        brand, model = self._split_name(name)
        post_number = self._parse_int(form_data.get("productId", "").strip())
        warranty_months = self._warranty_to_months(form_data.get("warranty", "").strip())
        image_urls, image_paths = self._save_images(existing["id"] if existing else None, uploaded_files)

        removed_paths = set(removed_image_paths or [])
        existing_all_paths = list(existing.get("image_paths") or []) if existing else []
        existing_image_paths = [path for path in existing_all_paths if path not in removed_paths]

        for path in removed_paths:
            if path in existing_all_paths:
                self.s3.delete_object(Bucket=self.bucket_name, Key=path)

        existing_images = [self._public_url(path) for path in existing_image_paths]

        return {
            "post_number": post_number,
            "brand": brand,
            "model": model,
            "condition": (form_data.get("desc", "").strip() or None),
            "warranty_months": warranty_months,
            "cpu": self._parse_cpu(form_data.get("cpu", "").strip()),
            "ram": self._parse_ram(form_data.get("ram", "").strip()),
            "storage": self._parse_storage(form_data.get("ssd", "").strip()),
            "display": self._parse_display(form_data.get("screen", "").strip()),
            "gpus": self._parse_gpus(form_data.get("gpu", "").strip()),
            "features": self._split_csv(form_data.get("features", "").strip()),
            "contacts": ["+998979660595", "+998558080907"],
            "links": self._build_links(form_data.get("note", "").strip()),
            "os": form_data.get("os", "").strip() or None,
            "price": price,
            "currency": "USD",
            "images": existing_images + image_urls,
            "image_paths": existing_image_paths + image_paths,
            "is_favorite": self._parse_bool(
                form_data.get("isFavorite"),
                default=bool(existing.get("is_favorite")) if existing else False,
            ),
        }

    def _save_images(self, product_id: str | None, uploaded_files: Iterable[FileStorage]) -> tuple[list[str], list[str]]:
        image_urls: list[str] = []
        image_paths: list[str] = []
        key_root = product_id or uuid.uuid4().hex

        for file in uploaded_files:
            if not file or not file.filename:
                continue

            safe_name = secure_filename(file.filename)
            object_path = f"laptops/{key_root}/{uuid.uuid4().hex}_{safe_name}"
            self.s3.upload_fileobj(
                file.stream,
                self.bucket_name,
                object_path,
                ExtraArgs={"ContentType": file.mimetype or "application/octet-stream"},
            )
            image_paths.append(object_path)
            image_urls.append(self._public_url(object_path))

        return image_urls, image_paths

    def _public_url(self, object_path: str) -> str:
        return self.s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": object_path},
            ExpiresIn=self.signed_url_expiry,
        )

    def _serialize_row(self, row: dict) -> dict:
        cpu = row.get("cpu") or {}
        ram = row.get("ram") or {}
        storage = row.get("storage") or {}
        display = row.get("display") or {}
        gpus = row.get("gpus") or []
        links = row.get("links") or {}

        warranty_months = row.get("warranty_months")
        warranty = f"{warranty_months // 12} Yil" if warranty_months and warranty_months % 12 == 0 else (f"{warranty_months} Oy" if warranty_months else "")
        gpu_label = ", ".join(filter(None, [gpu.get("name") for gpu in gpus if isinstance(gpu, dict)]))
        name = " ".join(part for part in [row.get("brand"), row.get("model")] if part)

        image_paths = row.get("image_paths") or []
        images = [self._public_url(path) for path in image_paths] if image_paths else (row.get("images") or [])

        return {
            "_docId": row.get("id"),
            "id": row.get("post_number"),
            "name": name,
            "price": row.get("price"),
            "warranty": warranty,
            "cpu": self._format_cpu(cpu),
            "ram": self._format_ram(ram),
            "gpu": gpu_label,
            "ssd": self._format_storage(storage),
            "screen": self._format_display(display),
            "os": row.get("os"),
            "features": row.get("features") or [],
            "note": links.get("note"),
            "desc": row.get("condition"),
            "images": images,
            "imageItems": [{"path": path, "url": self._public_url(path)} for path in image_paths],
            "createdAt": row.get("created_at"),
            "brand": row.get("brand"),
            "model": row.get("model"),
            "warrantyMonths": warranty_months,
            "links": links,
            "isFavorite": bool(row.get("is_favorite")),
        }

    def _split_name(self, name: str) -> tuple[str, str]:
        parts = name.split()
        if len(parts) <= 1:
            return name, ""
        return parts[0], " ".join(parts[1:])

    def _split_csv(self, value: str) -> list[str]:
        return [part.strip() for part in value.split(",") if part.strip()]

    def _parse_int(self, value: str) -> int | None:
        if not value:
            return None
        try:
            return int(value)
        except ValueError:
            return None

    def _parse_bool(self, value: str | None, default: bool = False) -> bool:
        if value is None:
            return default
        return str(value).strip().lower() in {"1", "true", "yes", "on"}

    def _warranty_to_months(self, value: str) -> int | None:
        if not value or value.lower() == "kafolatsiz":
            return None
        match = re.search(r"(\d+)", value)
        if not match:
            return None
        amount = int(match.group(1))
        return amount * 12 if "yil" in value.lower() else amount

    def _parse_cpu(self, value: str) -> dict:
        data = {"name": value} if value else {}
        if not value:
            return data
        if cores := re.search(r"(\d+)\s*yader", value, re.IGNORECASE):
            data["cores"] = int(cores.group(1))
        if ghz := re.search(r"(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*ghz", value, re.IGNORECASE):
            data["base_ghz"] = float(ghz.group(1))
            data["boost_ghz"] = float(ghz.group(2))
        return data

    def _parse_ram(self, value: str) -> dict:
        data = {"label": value} if value else {}
        if size := re.search(r"(\d+)\s*gb", value, re.IGNORECASE):
            data["size_gb"] = int(size.group(1))
        if ram_type := re.search(r"(ddr\d)", value, re.IGNORECASE):
            data["type"] = ram_type.group(1).upper()
        if speed := re.search(r"(\d+)\s*mhz", value, re.IGNORECASE):
            data["speed_mhz"] = int(speed.group(1))
        return data

    def _parse_storage(self, value: str) -> dict:
        data = {"label": value} if value else {}
        if size_tb := re.search(r"(\d+(?:\.\d+)?)\s*tb", value, re.IGNORECASE):
            data["size_gb"] = int(float(size_tb.group(1)) * 1000)
        elif size_gb := re.search(r"(\d+)\s*gb", value, re.IGNORECASE):
            data["size_gb"] = int(size_gb.group(1))
        if storage_type := re.search(r"(ssd|hdd)", value, re.IGNORECASE):
            data["type"] = storage_type.group(1).upper()
        if "nvme" in value.lower():
            data["interface"] = "NVME"
        return data

    def _parse_display(self, value: str) -> dict:
        data = {"label": value} if value else {}
        if size := re.search(r"(\d+(?:\.\d+)?)", value):
            data["size_inch"] = float(size.group(1))
        if resolution := re.search(r"\b(2k|4k|fhd|qhd)\b", value, re.IGNORECASE):
            data["resolution"] = resolution.group(1).upper()
        if panel := re.search(r"\b(oled|ips|mini led)\b", value, re.IGNORECASE):
            data["panel"] = panel.group(1).upper()
        return data

    def _parse_gpus(self, value: str) -> list[dict]:
        if not value:
            return []
        gpu = {"name": value}
        if vram := re.search(r"(\d+)\s*gb", value, re.IGNORECASE):
            gpu["vram_gb"] = int(vram.group(1))
        gpu["type"] = "dedicated" if "rtx" in value.lower() or "gtx" in value.lower() else "integrated"
        return [gpu]

    def _build_links(self, note: str) -> dict:
        return {
            "note": note or None,
            "admin": "http://t.me/rogadmin",
            "telegram_group": "https://t.me/noteboks_uz",
            "instagram": "https://www.instagram.com/noutbuk_kompyuter",
            "channel": "http://t.me/noutbuk_kompyuter",
        }

    def _format_cpu(self, data: dict) -> str:
        if not data:
            return ""
        parts = [data.get("name", "")]
        if data.get("cores"):
            parts.append(f"{data['cores']} Yader")
        if data.get("base_ghz") and data.get("boost_ghz"):
            parts.append(f"({data['base_ghz']}-{data['boost_ghz']}GHz)")
        return " ".join(part for part in parts if part)

    def _format_ram(self, data: dict) -> str:
        if not data:
            return ""
        if data.get("label"):
            return data["label"]
        parts = []
        if data.get("size_gb"):
            parts.append(f"{data['size_gb']}GB")
        if data.get("type"):
            parts.append(data["type"])
        if data.get("speed_mhz"):
            parts.append(f"{data['speed_mhz']}MHz")
        return " ".join(parts)

    def _format_storage(self, data: dict) -> str:
        if not data:
            return ""
        if data.get("label"):
            return data["label"]
        parts = []
        if data.get("size_gb"):
            parts.append(f"{data['size_gb']}GB")
        if data.get("type"):
            parts.append(data["type"])
        if data.get("interface"):
            parts.append(data["interface"])
        return " ".join(parts)

    def _format_display(self, data: dict) -> str:
        if not data:
            return ""
        if data.get("label"):
            return data["label"]
        parts = []
        if data.get("size_inch"):
            parts.append(f"{data['size_inch']}\"")
        if data.get("resolution"):
            parts.append(data["resolution"])
        if data.get("panel"):
            parts.append(data["panel"])
        return " ".join(parts)
