# UC trazabilidad (plan Login + recibos):
# UC-Auth-01/02 + API: A1–A5
#   A1: sin Bearer ni X-User-Id (sin modo dev) → 401
#   A2: Bearer vacío / token inválido → 401
#   A3: Bearer válido (JWT verificado vía Supabase) → UUID del usuario
#   A4: LAB10_ALLOW_X_USER_ID=1 + X-User-Id válido → UUID de la cabecera
#   A5: Bearer válido + X-User-Id distinto → gana el Bearer
# UC-Upload-01/02 (UI): F5–F7; manual U1–U5

from __future__ import annotations

from unittest.mock import MagicMock
from uuid import UUID

import pytest
from fastapi import HTTPException

from lab10_api.api.deps import resolve_authenticated_user_id

BEARER_UUID = UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
HEADER_UUID = UUID("11111111-2222-3333-4444-555555555555")


def _mock_supabase_user(user_id: str | UUID) -> MagicMock:
    user = MagicMock()
    user.id = str(user_id)
    resp = MagicMock()
    resp.user = user
    client = MagicMock()
    client.auth.get_user.return_value = resp
    return client


def test_uc_auth_a1_no_credentials_401() -> None:
    client = MagicMock()
    with pytest.raises(HTTPException) as exc:
        resolve_authenticated_user_id(
            None,
            None,
            allow_x_user_id_header=False,
            supabase=client,
        )
    assert exc.value.status_code == 401


def test_uc_auth_a2_invalid_bearer_401() -> None:
    client = MagicMock()
    client.auth.get_user.return_value = None
    with pytest.raises(HTTPException) as exc:
        resolve_authenticated_user_id(
            "Bearer badtoken",
            None,
            allow_x_user_id_header=False,
            supabase=client,
        )
    assert exc.value.status_code == 401
    client.auth.get_user.assert_called_once_with("badtoken")


def test_uc_auth_a3_valid_bearer_returns_user_uuid() -> None:
    client = _mock_supabase_user(BEARER_UUID)
    uid = resolve_authenticated_user_id(
        "Bearer valid.jwt",
        None,
        allow_x_user_id_header=False,
        supabase=client,
    )
    assert uid == BEARER_UUID


def test_uc_auth_a4_x_user_id_when_allowed() -> None:
    client = MagicMock()
    uid = resolve_authenticated_user_id(
        None,
        str(HEADER_UUID),
        allow_x_user_id_header=True,
        supabase=client,
    )
    assert uid == HEADER_UUID
    client.auth.get_user.assert_not_called()


def test_uc_auth_a5_bearer_wins_over_x_user_id() -> None:
    client = _mock_supabase_user(BEARER_UUID)
    uid = resolve_authenticated_user_id(
        "Bearer valid.jwt",
        str(HEADER_UUID),
        allow_x_user_id_header=True,
        supabase=client,
    )
    assert uid == BEARER_UUID


def test_uc_auth_bearer_missing_token_after_scheme_401() -> None:
    client = MagicMock()
    with pytest.raises(HTTPException) as exc:
        resolve_authenticated_user_id(
            "Bearer",
            None,
            allow_x_user_id_header=False,
            supabase=client,
        )
    assert exc.value.status_code == 401
