from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from supabase import Client

from lab10_api.core.config import get_settings
from lab10_api.core.supabase_client import get_supabase_client


def require_supabase() -> Client:
    client = get_supabase_client()
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase no configurado: defina SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY",
        )
    return client


def _parse_bearer(authorization: str | None) -> str | None:
    if not authorization or not authorization.strip():
        return None
    parts = authorization.strip().split(None, 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    return token or None


def resolve_authenticated_user_id(
    authorization: str | None,
    x_user_id: str | None,
    *,
    allow_x_user_id_header: bool,
    supabase: Client,
) -> UUID:
    """Resuelve el UUID de auth.users desde Bearer (prioritario) o X-User-Id en modo dev."""
    token = _parse_bearer(authorization)
    if token is not None:
        user_resp = supabase.auth.get_user(token)
        if user_resp is None or getattr(user_resp, "user", None) is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
            )
        try:
            return UUID(str(user_resp.user.id))
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
            ) from e

    if allow_x_user_id_header and x_user_id:
        try:
            return UUID(x_user_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="X-User-Id debe ser un UUID válido",
            ) from e

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Se requiere Authorization: Bearer <access_token>",
    )


def require_user_id(
    authorization: Annotated[str | None, Header()] = None,
    x_user_id: Annotated[str | None, Header(alias="X-User-Id")] = None,
) -> UUID:
    supabase = get_supabase_client()
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase no configurado: defina SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY",
        )
    settings = get_settings()
    return resolve_authenticated_user_id(
        authorization,
        x_user_id,
        allow_x_user_id_header=settings.lab10_allow_x_user_id,
        supabase=supabase,
    )


SupabaseDep = Annotated[Client, Depends(require_supabase)]
UserIdDep = Annotated[UUID, Depends(require_user_id)]
