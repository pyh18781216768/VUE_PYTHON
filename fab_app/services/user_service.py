from __future__ import annotations

from datetime import datetime, timedelta
from uuid import uuid4

from werkzeug.security import check_password_hash

from fab_app.repositories import user_repository


DEFAULT_PASSWORD = "123456"
DEFAULT_USERNAME = "admin"
DEFAULT_DISPLAY_NAME = "超級管理員"
ACTIVE_SESSION_TIMEOUT_MINUTES = 12 * 60
ROLE_PERMISSION_LEVELS = {
    "user": 1,
    "line_leader": 5,
    "section_chief": 5,
    "department_head": 5,
    "admin": 5,
}
ROLE_ALIASES = {
    "普通使用者": "user",
    "普通用户": "user",
    "線組長": "line_leader",
    "线组长": "line_leader",
    "科長": "section_chief",
    "科长": "section_chief",
    "部長": "department_head",
    "部长": "department_head",
    "超級管理員": "admin",
    "超级管理员": "admin",
}
SUPERVISOR_ROLES = {"line_leader", "section_chief", "department_head"}


def ensure_user_store() -> None:
    user_repository.ensure_user_table()
    rows = user_repository.fetch_all_users()

    if not any(_normalize_text(row["user"]) == DEFAULT_USERNAME for row in rows):
        user_repository.insert_user(
            {
                "user": DEFAULT_USERNAME,
                "password": DEFAULT_PASSWORD,
                "display_name": DEFAULT_DISPLAY_NAME,
                "email": "",
                "phone": "",
                "department": "",
                "supervisor_user": "",
                "role": "admin",
                "is_active": 1,
                "shift_group_id": None,
                "created_at": datetime.now().isoformat(timespec="seconds"),
                "updated_at": datetime.now().isoformat(timespec="seconds"),
            }
        )

    for row in rows:
        username = _normalize_text(row["user"])
        password = _normalize_text(row["password"])
        payload = {"rowid": row["rowid"]}
        changed = False

        if row["user"] != username:
            payload["user"] = username
            changed = True

        if not password:
            payload["password"] = DEFAULT_PASSWORD
            payload["updated_at"] = datetime.now().isoformat(timespec="seconds")
            changed = True

        role = _normalize_role(row["role"]) or ("admin" if username == DEFAULT_USERNAME else "user")
        if _normalize_text(row["role"]).lower() != role:
            payload["role"] = role
            changed = True

        is_active = row["is_active"]
        if is_active is None:
            payload["is_active"] = 1
            changed = True

        if username == DEFAULT_USERNAME:
            if _normalize_text(row["display_name"]) != DEFAULT_DISPLAY_NAME:
                payload["display_name"] = DEFAULT_DISPLAY_NAME
                changed = True
            if role != "admin":
                payload["role"] = "admin"
                changed = True

        if changed:
            user_repository.update_user_row(row["rowid"], payload)


def authenticate_user(username: str, password: str):
    normalized_username = _normalize_text(username)
    if not normalized_username or not password:
        return None

    row = user_repository.fetch_user(normalized_username)
    if not row:
        return None
    if row["is_active"] is not None and not bool(row["is_active"]):
        return None

    stored_password = _normalize_text(row["password"])
    if not stored_password or not _password_matches(row, password):
        return None

    return _build_profile(row)


def issue_login_session(username: str, client_id: str) -> str:
    normalized_username = _normalize_text(username)
    normalized_client_id = _normalize_text(client_id)
    token = uuid4().hex
    user_repository.update_active_session(
        normalized_username,
        token,
        datetime.now().isoformat(timespec="seconds"),
        normalized_client_id,
    )
    return token


def has_active_login_session(username: str, client_id: str | None = None) -> bool:
    normalized_username = _normalize_text(username)
    normalized_client_id = _normalize_text(client_id)
    if not normalized_username:
        return False

    row = user_repository.fetch_user(normalized_username)
    if not row:
        return False

    token = _normalize_text(row["active_session_token"])
    if not token:
        return False

    updated_at = _parse_datetime(row["active_session_updated_at"])
    if not updated_at or datetime.now() - updated_at > timedelta(minutes=ACTIVE_SESSION_TIMEOUT_MINUTES):
        user_repository.clear_active_session(normalized_username, token)
        return False

    active_client_id = _normalize_text(row["active_session_client_id"])
    if normalized_client_id and active_client_id == normalized_client_id:
        return False

    return True


def is_login_token_current(username: str, token: str) -> bool:
    normalized_username = _normalize_text(username)
    normalized_token = _normalize_text(token)
    if not normalized_username or not normalized_token:
        return False

    row = user_repository.fetch_user(normalized_username)
    if not row:
        return False
    return _normalize_text(row["active_session_token"]) == normalized_token


def is_login_session_current(username: str, token: str, client_id: str) -> bool:
    normalized_username = _normalize_text(username)
    normalized_token = _normalize_text(token)
    normalized_client_id = _normalize_text(client_id)
    if not normalized_username or not normalized_token or not normalized_client_id:
        return False

    row = user_repository.fetch_user(normalized_username)
    if not row:
        return False
    if _normalize_text(row["active_session_token"]) != normalized_token:
        return False

    active_client_id = _normalize_text(row["active_session_client_id"])
    if not active_client_id:
        user_repository.update_active_session(
            normalized_username,
            normalized_token,
            datetime.now().isoformat(timespec="seconds"),
            normalized_client_id,
        )
        return True
    return active_client_id == normalized_client_id


def touch_login_session(username: str, token: str, client_id: str) -> None:
    normalized_username = _normalize_text(username)
    normalized_token = _normalize_text(token)
    normalized_client_id = _normalize_text(client_id)
    if not normalized_username or not normalized_token or not normalized_client_id:
        return
    if not is_login_token_current(normalized_username, normalized_token):
        return
    user_repository.update_active_session(
        normalized_username,
        normalized_token,
        datetime.now().isoformat(timespec="seconds"),
        normalized_client_id,
    )


def clear_login_session(username: str, token: str | None = None, client_id: str | None = None) -> None:
    normalized_username = _normalize_text(username)
    if not normalized_username:
        return
    user_repository.clear_active_session(
        normalized_username,
        _normalize_text(token) or None,
        _normalize_text(client_id) or None,
    )


def get_user_profile(username: str):
    normalized_username = _normalize_text(username)
    row = user_repository.fetch_user(normalized_username)
    if not row:
        raise KeyError(normalized_username)
    return _build_profile(row)


def update_user_profile(username: str, profile_data, new_password: str | None = None):
    normalized_username = _normalize_text(username)
    row = user_repository.fetch_user(normalized_username)
    if not row:
        raise KeyError(normalized_username)

    supervisor_user = _normalize_text(profile_data.get("supervisor_user"))
    if supervisor_user:
        if supervisor_user == normalized_username:
            raise ValueError("主管不能設定為自己。")
        supervisor_row = user_repository.fetch_user(supervisor_user)
        if not supervisor_row or _normalize_role(supervisor_row["role"]) not in SUPERVISOR_ROLES:
            raise ValueError("主管必須是線組長、科長或部長。")

    updated_at = datetime.now().isoformat(timespec="seconds")
    payload = {
        "display_name": _normalize_text(profile_data.get("display_name")),
        "department": _normalize_text(profile_data.get("department")),
        "supervisor_user": supervisor_user,
        "email": _normalize_text(profile_data.get("email")),
        "phone": _normalize_text(profile_data.get("phone")),
        "updated_at": updated_at,
    }
    if new_password:
        payload["password"] = new_password

    user_repository.update_user_by_username(normalized_username, payload)
    return get_user_profile(normalized_username)


def _build_profile(row) -> dict[str, str]:
    username = _normalize_text(row["user"])
    display_name = _normalize_text(row["display_name"])
    supervisor_user = _normalize_text(row["supervisor_user"])
    supervisor_row = user_repository.fetch_user(supervisor_user) if supervisor_user else None
    supervisor_display_name = _normalize_text(supervisor_row["display_name"]) if supervisor_row else ""
    return {
        "username": username,
        "displayName": display_name,
        "displayLabel": display_name or username,
        "department": _normalize_text(row["department"]),
        "supervisorUser": supervisor_user,
        "supervisorLabel": supervisor_display_name or supervisor_user,
        "email": _normalize_text(row["email"]),
        "phone": _normalize_text(row["phone"]),
        "role": _normalize_role(row["role"]),
        "permissionLevel": ROLE_PERMISSION_LEVELS.get(_normalize_role(row["role"]), 1),
        "isActive": bool(row["is_active"] if row["is_active"] is not None else 1),
        "shiftGroupId": row["shift_group_id"],
        "updatedAt": _normalize_text(row["updated_at"]),
    }


def _normalize_text(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _parse_datetime(value):
    text = _normalize_text(value)
    if not text:
        return None
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def _normalize_role(value) -> str:
    role = _normalize_text(value).lower()
    role = ROLE_ALIASES.get(role, role)
    return role if role in ROLE_PERMISSION_LEVELS else "user"


def _looks_like_hash(value: str) -> bool:
    return "$" in value and ":" in value


def _password_matches(row, password: str) -> bool:
    stored_password = _normalize_text(row["password"])
    if not stored_password:
        return False

    if stored_password == password:
        return True

    if not _looks_like_hash(stored_password):
        return False

    if not check_password_hash(stored_password, password):
        return False

    user_repository.update_user_row(
        row["rowid"],
        {
            "rowid": row["rowid"],
            "password": password,
            "updated_at": datetime.now().isoformat(timespec="seconds"),
        },
    )
    return True
