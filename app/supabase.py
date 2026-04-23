import os

import boto3
from botocore.config import Config
from supabase import Client, create_client


class SupabaseConfigError(RuntimeError):
    pass


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value or value.startswith("YOUR_"):
        raise SupabaseConfigError(
            f"Supabase env '{name}' is missing. Fill it in inside the .env file."
        )
    return value


def _env_with_fallback(primary: str, fallback: str | None = None) -> str:
    value = os.getenv(primary, "").strip()
    if value and not value.startswith("YOUR_"):
        return value

    if fallback:
        fallback_value = os.getenv(fallback, "").strip()
        if fallback_value and not fallback_value.startswith("YOUR_"):
            return fallback_value

    raise SupabaseConfigError(
        f"Supabase env '{primary}' is missing. Fill it in inside the .env file."
    )


def create_supabase_client() -> Client:
    url = _env_with_fallback("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")
    service_role_key = _required_env("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, service_role_key)


def create_s3_client():
    endpoint_url = _required_env("SUPABASE_S3_ENDPOINT")
    access_key = _required_env("SUPABASE_ACCESS_KEY_ID")
    secret_key = _required_env("SUPABASE_SECRET_ACCESS_KEY")

    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def initialize_supabase(app=None) -> None:
    url = _env_with_fallback("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")
    service_role_key = _required_env("SUPABASE_SERVICE_ROLE_KEY")
    bucket = _required_env("SUPABASE_BUCKET")
    s3_endpoint = _required_env("SUPABASE_S3_ENDPOINT")
    _required_env("SUPABASE_ACCESS_KEY_ID")
    _required_env("SUPABASE_SECRET_ACCESS_KEY")

    if app is not None:
        app.config["SUPABASE_URL"] = url
        app.config["SUPABASE_SERVICE_ROLE_KEY"] = service_role_key
        app.config["SUPABASE_BUCKET"] = bucket
        app.config["SUPABASE_S3_ENDPOINT"] = s3_endpoint
