from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_receipts_bucket: str = "receipts"
    lab10_allow_x_user_id: bool = False

    @field_validator("lab10_allow_x_user_id", mode="before")
    @classmethod
    def _coerce_lab10_allow_x_user_id(cls, v: object) -> bool:
        if v is None or v == "":
            return False
        if isinstance(v, bool):
            return v
        s = str(v).strip().lower()
        return s in ("1", "true", "yes", "on")


@lru_cache
def get_settings() -> Settings:
    return Settings()
