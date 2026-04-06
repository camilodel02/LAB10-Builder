from supabase import Client, create_client

from lab10_api.core.config import get_settings


def get_supabase_client() -> Client | None:
    s = get_settings()
    if not s.supabase_url or not s.supabase_service_role_key:
        return None
    return create_client(s.supabase_url, s.supabase_service_role_key)
