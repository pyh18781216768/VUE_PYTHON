from __future__ import annotations

from functools import wraps

from flask import Blueprint, jsonify, request, session

from fab_app.services.user_service import (
    authenticate_user,
    clear_login_session,
    get_user_profile,
    has_active_login_session,
    is_login_token_current,
    issue_login_session,
    touch_login_session,
    update_user_profile,
)


auth_blueprint = Blueprint("auth", __name__)
SESSION_TOKEN_KEY = "session_token"
CLIENT_INSTANCE_HEADER = "X-Client-Instance"


def current_username():
    return session.get("username")


def current_session_token():
    return session.get(SESSION_TOKEN_KEY)


def current_client_instance():
    return str(request.headers.get(CLIENT_INSTANCE_HEADER, "")).strip()


def _clear_current_session() -> None:
    clear_login_session(current_username(), current_session_token(), current_client_instance())
    session.clear()


def login_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        username = current_username()
        if not username or not current_session_token():
            return jsonify({"message": "請先登入後再訪問。"}), 401

        try:
            get_user_profile(username)
        except KeyError:
            session.clear()
            return jsonify({"message": "登入狀態已失效，請重新登入。"}), 401

        if not is_login_token_current(username, current_session_token()):
            session.clear()
            return jsonify({"message": "此帳號已在其他地方登入，請重新登入。"}), 401

        client_instance = current_client_instance()
        if client_instance:
            touch_login_session(username, current_session_token(), client_instance)
        return view_func(*args, **kwargs)

    return wrapped


@auth_blueprint.get("/api/session")
def session_info():
    username = current_username()
    if not username or not current_session_token() or not current_client_instance():
        return jsonify({"authenticated": False, "user": None})

    try:
        profile = get_user_profile(username)
    except KeyError:
        session.clear()
        return jsonify({"authenticated": False, "user": None})

    if not is_login_token_current(username, current_session_token()):
        session.clear()
        return jsonify(
            {
                "authenticated": False,
                "user": None,
                "message": "此帳號已在其他地方登入，請重新登入。",
            }
        )

    touch_login_session(username, current_session_token(), current_client_instance())
    return jsonify({"authenticated": True, "user": profile})


@auth_blueprint.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))

    if not username or not password:
        return jsonify({"message": "請輸入工號和密碼。"}), 400
    if not current_client_instance():
        return jsonify({"message": "登入環境無效，請刷新頁面後再試。"}), 400

    profile = authenticate_user(username, password)
    if not profile:
        return jsonify({"message": "工號或密碼錯誤。"}), 401

    if has_active_login_session(profile["username"], current_client_instance()):
        return jsonify({"message": "此帳號已登入，不能重複登入。請先退出原登入。"}), 409

    session.clear()
    session["username"] = profile["username"]
    session[SESSION_TOKEN_KEY] = issue_login_session(profile["username"], current_client_instance())
    return jsonify({"message": "登入成功。", "user": profile})


@auth_blueprint.post("/api/logout")
def logout():
    _clear_current_session()
    return jsonify({"message": "已退出登入。"})


@auth_blueprint.get("/api/profile")
@login_required
def profile():
    return jsonify(get_user_profile(current_username()))


@auth_blueprint.post("/api/profile")
@login_required
def save_profile():
    payload = request.get_json(silent=True) or {}
    requested_username = str(payload.get("username", "")).strip()

    if requested_username and requested_username != current_username():
        return jsonify({"message": "工號不可修改。"}), 400

    new_password = str(payload.get("newPassword", "") or "")
    confirm_password = str(payload.get("confirmPassword", "") or "")

    if new_password or confirm_password:
        if new_password != confirm_password:
            return jsonify({"message": "兩次輸入的新密碼不一致。"}), 400
        if len(new_password) < 6:
            return jsonify({"message": "新密碼長度不能少於 6 位。"}), 400
    else:
        new_password = None

    profile = update_user_profile(
        current_username(),
        {
            "display_name": payload.get("displayName", ""),
            "department": payload.get("department", ""),
            "supervisor_user": payload.get("supervisorUser", ""),
            "email": payload.get("email", ""),
            "phone": payload.get("phone", ""),
        },
        new_password=new_password,
    )
    return jsonify({"message": "個人資訊已儲存。", "user": profile})
