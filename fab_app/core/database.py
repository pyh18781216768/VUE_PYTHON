from __future__ import annotations

import sqlite3
from pathlib import Path

from fab_app.config import AppConfig
from fab_app.models.dashboard import normalize_page


def get_user_database_path() -> Path:
    return Path(AppConfig.USER_DATABASE_PATH)


def get_dashboard_database_path(page: str) -> Path:
    normalized_page = normalize_page(page)
    return Path(AppConfig.DASHBOARD_DATABASE_PATHS[normalized_page])


def get_database_path(page: str | None = None) -> Path:
    if page:
        return get_dashboard_database_path(page)
    return get_user_database_path()


def get_connection(page: str | None = None) -> sqlite3.Connection:
    database_path = get_database_path(page)
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(database_path))
    connection.row_factory = sqlite3.Row
    return connection
