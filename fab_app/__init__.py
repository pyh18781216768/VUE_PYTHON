from __future__ import annotations

from flask import Flask

from fab_app.config import AppConfig, BASE_DIR
from fab_app.controllers.auth_controller import auth_blueprint
from fab_app.controllers.dashboard_controller import dashboard_blueprint
from fab_app.controllers.task_controller import task_blueprint
from fab_app.controllers.web_controller import web_blueprint
from fab_app.services.task_system_service import ensure_task_system_store
from fab_app.services.user_service import ensure_user_store


def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder=str(BASE_DIR / "templates"),
        static_folder=str(BASE_DIR / "static"),
    )
    app.config.from_object(AppConfig)
    app.secret_key = app.config["SECRET_KEY"]
    app.json.ensure_ascii = False

    ensure_user_store()
    ensure_task_system_store()
    _register_blueprints(app)
    return app


def _register_blueprints(app: Flask) -> None:
    app.register_blueprint(web_blueprint)
    app.register_blueprint(auth_blueprint)
    app.register_blueprint(dashboard_blueprint)
    app.register_blueprint(task_blueprint)
