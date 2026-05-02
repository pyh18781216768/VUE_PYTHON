from __future__ import annotations

from flask import Blueprint, render_template

from fab_app.config import BASE_DIR


web_blueprint = Blueprint("web", __name__)


@web_blueprint.get("/")
@web_blueprint.get("/login")
@web_blueprint.get("/angle")
@web_blueprint.get("/oc")
@web_blueprint.get("/lens")
@web_blueprint.get("/task-system/handover")
@web_blueprint.get("/task-system/tasks")
@web_blueprint.get("/task-system/users")
@web_blueprint.get("/task-system/operations")
@web_blueprint.get("/task-system/settings")
@web_blueprint.get("/frontend")
@web_blueprint.get("/frontend/<path:subpath>")
def index(subpath: str | None = None):
    return render_template("frontend_index.html", asset_version=_frontend_asset_version())


def _frontend_asset_version() -> int:
    asset_path = BASE_DIR / "static" / "frontend" / "assets" / "index.js"
    try:
        return int(asset_path.stat().st_mtime)
    except OSError:
        return 0
