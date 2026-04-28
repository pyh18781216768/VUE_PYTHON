from __future__ import annotations

from flask import Blueprint, render_template


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
def index():
    return render_template("index.html")
