from __future__ import annotations

from flask import Blueprint, jsonify, request, send_file

from fab_app.controllers.auth_controller import login_required
from fab_app.core.database import get_database_path
from fab_app.services.dashboard_service import get_dashboard_data, get_supported_pages
from fab_app.services.export_service import export_excel_file


dashboard_blueprint = Blueprint("dashboard", __name__)


@dashboard_blueprint.get("/api/dashboard")
@login_required
def dashboard():
    refresh = request.args.get("refresh") == "1"
    page = request.args.get("page", "angle")
    try:
        payload = get_dashboard_data(page=page, refresh=refresh)
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify(payload)


@dashboard_blueprint.post("/api/export-excel")
@login_required
def export_excel():
    payload = request.get_json(silent=True) or {}
    page = payload.get("page", "angle")
    filters = payload.get("filters") or {}
    columns = payload.get("columns") or []
    refresh = bool(payload.get("refresh"))

    try:
        buffer, filename = export_excel_file(
            page=page,
            filters=filters,
            columns=columns,
            refresh=refresh,
        )
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400

    return send_file(
        buffer,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@dashboard_blueprint.get("/api/health")
def health():
    page_counts = {
        page: get_dashboard_data(page=page)["recordCount"]
        for page in get_supported_pages()
    }
    database_paths = {
        page: str(get_database_path(page))
        for page in get_supported_pages()
    }
    return jsonify(
        {
            "status": "ok",
            "databasePaths": database_paths,
            "pages": list(get_supported_pages()),
            "recordCounts": page_counts,
        }
    )
