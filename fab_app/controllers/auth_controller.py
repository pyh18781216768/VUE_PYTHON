from __future__ import annotations

from functools import wraps

from flask import Blueprint, jsonify, request, session

from fab_app.services.user_service import authenticate_user, get_user_profile, update_user_profile


auth_blueprint = Blueprint("auth", __name__)


def current_username():
    return session.get("username")


def login_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        username = current_username()
        if not username:
            return jsonify({"message": "请先登录后再访问。"}), 401

        try:
            get_user_profile(username)
        except KeyError:
            session.clear()
            return jsonify({"message": "登录状态已失效，请重新登录。"}), 401

        return view_func(*args, **kwargs)

    return wrapped


@auth_blueprint.get("/api/session")
def session_info():
    username = current_username()
    if not username:
        return jsonify({"authenticated": False, "user": None})

    try:
        profile = get_user_profile(username)
    except KeyError:
        session.clear()
        return jsonify({"authenticated": False, "user": None})

    return jsonify({"authenticated": True, "user": profile})


@auth_blueprint.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))

    if not username or not password:
        return jsonify({"message": "请输入工号和密码。"}), 400

    profile = authenticate_user(username, password)
    if not profile:
        return jsonify({"message": "工号或密码错误。"}), 401

    session.clear()
    session["username"] = profile["username"]
    return jsonify({"message": "登录成功。", "user": profile})


@auth_blueprint.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"message": "已退出登录。"})


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
        return jsonify({"message": "工号不可修改。"}), 400

    new_password = str(payload.get("newPassword", "") or "")
    confirm_password = str(payload.get("confirmPassword", "") or "")

    if new_password or confirm_password:
        if new_password != confirm_password:
            return jsonify({"message": "两次输入的新密码不一致。"}), 400
        if len(new_password) < 6:
            return jsonify({"message": "新密码长度不能少于 6 位。"}), 400
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
    return jsonify({"message": "个人信息已保存。", "user": profile})
