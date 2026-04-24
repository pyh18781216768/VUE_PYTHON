from __future__ import annotations

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


class AppConfig:
    SECRET_KEY = os.environ.get("APP_SECRET_KEY", "fab-dashboard-local-secret")
    DATABASE_DIR = Path(
        os.environ.get("APP_DATABASE_DIR", r"E:\pyh\data")
    )
    USER_DATABASE_PATH = Path(
        os.environ.get("APP_USER_DATABASE_PATH", str(DATABASE_DIR / "user.db"))
    )
    DASHBOARD_DATABASE_PATHS = {
        "angle": Path(
            os.environ.get("APP_DATABASE_PATH_ANGLE", str(DATABASE_DIR / "andle_out_to.db"))
        ),
        "oc": Path(
            os.environ.get("APP_DATABASE_PATH_OC", str(DATABASE_DIR / "oc.db"))
        ),
        "lens": Path(
            os.environ.get("APP_DATABASE_PATH_LENS", str(DATABASE_DIR / "LBI_lens.db"))
        ),
    }
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    JSON_AS_ASCII = False
