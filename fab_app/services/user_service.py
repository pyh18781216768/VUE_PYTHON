from __future__ import annotations

from datetime import datetime

from werkzeug.security import check_password_hash

from fab_app.repositories import user_repository


DEFAULT_PASSWORD = "123456"
DEFAULT_USERNAME = "admin"
DEFAULT_DISPLAY_NAME = "超级管理员"
ROLE_PERMISSION_LEVELS = {
    "user": 1,
    "line_leader": 5,
    "section_chief": 5,
    "department_head": 5,
    "admin": 5,
}
ROLE_ALIASES = {
    "普通用户": "user",
    "线组长": "line_leader",
    "科长": "section_chief",
    "部长": "department_head",
    "超级管理员": "admin",
}


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

    updated_at = datetime.now().isoformat(timespec="seconds")
    payload = {
        "display_name": _normalize_text(profile_data.get("display_name")),
        "department": _normalize_text(profile_data.get("department")),
        "supervisor_user": _normalize_text(profile_data.get("supervisor_user")),
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
