from __future__ import annotations

import json
import mimetypes
from functools import wraps

from flask import Blueprint, jsonify, request, send_file

from fab_app.controllers.auth_controller import current_username, login_required
from fab_app.services.task_export_service import export_task_data
from fab_app.services.task_system_service import (
    claim_task,
    delete_department,
    delete_floor,
    delete_handover_record,
    delete_shift_group,
    delete_task,
    get_attachment_file,
    get_reminders,
    get_report_summary,
    get_task_system_payload,
    get_user_summary,
    get_system_settings,
    list_departments,
    list_handover_records,
    list_floors,
    list_operation_logs,
    list_shift_groups,
    list_tasks,
    list_users,
    record_operation,
    save_handover_record,
    save_department,
    save_floor,
    save_shift_group,
    save_task,
    save_user,
    reject_task,
)


task_blueprint = Blueprint("task_system", __name__)


def admin_required(view_func):
    @wraps(view_func)
    @login_required
    def wrapped(*args, **kwargs):
        profile = get_user_summary(current_username())
        if int(profile.get("permissionLevel") or 1) < 5:
            return jsonify({"message": "当前账号没有管理员权限。"}), 403
        return view_func(*args, **kwargs)

    return wrapped


@task_blueprint.get("/api/task-system/bootstrap")
@login_required
def task_system_bootstrap():
    return jsonify(get_task_system_payload(current_username()))


@task_blueprint.get("/api/task-system/users")
@login_required
def task_users():
    return jsonify({"items": list_users()})


@task_blueprint.post("/api/task-system/users")
@admin_required
def save_task_user():
    payload = request.get_json(silent=True) or {}
    try:
        item = save_user(payload, current_username())
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"item": item})


@task_blueprint.get("/api/task-system/shifts")
@login_required
def task_shifts():
    return jsonify({"items": list_shift_groups()})


@task_blueprint.post("/api/task-system/shifts")
@admin_required
def save_task_shift():
    payload = request.get_json(silent=True) or {}
    try:
        item = save_shift_group(payload, current_username())
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"item": item})


@task_blueprint.delete("/api/task-system/shifts/<int:shift_group_id>")
@admin_required
def delete_task_shift(shift_group_id: int):
    try:
        delete_shift_group(shift_group_id, current_username())
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"message": "班次已删除。"})


@task_blueprint.get("/api/task-system/floors")
@login_required
def task_floors():
    return jsonify({"items": list_floors()})


@task_blueprint.post("/api/task-system/floors")
@admin_required
def save_task_floor():
    payload = request.get_json(silent=True) or {}
    try:
        item = save_floor(payload, current_username())
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"item": item})


@task_blueprint.delete("/api/task-system/floors/<int:floor_id>")
@admin_required
def delete_task_floor(floor_id: int):
    try:
        delete_floor(floor_id, current_username())
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"message": "楼层已删除。"})


@task_blueprint.get("/api/task-system/departments")
@login_required
def task_departments():
    return jsonify({"items": list_departments()})


@task_blueprint.post("/api/task-system/departments")
@admin_required
def save_task_department():
    payload = request.get_json(silent=True) or {}
    try:
        item = save_department(payload, current_username())
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"item": item})


@task_blueprint.delete("/api/task-system/departments/<int:department_id>")
@admin_required
def delete_task_department(department_id: int):
    try:
        delete_department(department_id, current_username())
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"message": "部门已删除。"})


@task_blueprint.get("/api/task-system/settings")
@login_required
def task_settings():
    return jsonify(get_system_settings())


@task_blueprint.get("/api/task-system/operation-logs")
@admin_required
def operation_logs():
    return jsonify({"items": list_operation_logs(request.args)})


@task_blueprint.post("/api/task-system/operation-logs")
@login_required
def create_operation_log():
    payload = request.get_json(silent=True) or {}
    try:
        item = record_operation(
            current_username(),
            payload.get("pageName"),
            payload.get("actionType") or "查看",
            payload.get("recordLabel"),
            payload.get("recordId"),
        )
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"item": item})


@task_blueprint.get("/api/task-system/handover-records")
@login_required
def handover_records():
    return jsonify({"items": list_handover_records(request.args)})


@task_blueprint.post("/api/task-system/handover-records")
@login_required
def save_handover():
    payload = _read_payload()
    files = request.files.getlist("attachments")
    try:
        item = save_handover_record(payload, files, current_username())
    except (KeyError, ValueError) as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"item": item})


@task_blueprint.delete("/api/task-system/handover-records/<int:record_id>")
@login_required
def delete_handover(record_id: int):
    try:
        delete_handover_record(record_id, current_username())
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"message": "交接班记录已删除。"})


@task_blueprint.get("/api/task-system/tasks")
@login_required
def tasks():
    return jsonify({"items": list_tasks(request.args)})


@task_blueprint.post("/api/task-system/tasks")
@login_required
def save_task_item():
    payload = _read_payload()
    files = request.files.getlist("attachments")
    try:
        item = save_task(payload, files, current_username())
    except (KeyError, ValueError) as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"item": item})


@task_blueprint.post("/api/task-system/tasks/<int:task_id>/claim")
@login_required
def claim_task_item(task_id: int):
    try:
        item = claim_task(task_id, current_username())
    except (KeyError, ValueError) as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"item": item})


@task_blueprint.post("/api/task-system/tasks/<int:task_id>/reject")
@login_required
def reject_task_item(task_id: int):
    payload = _read_payload()
    try:
        item = reject_task(task_id, payload.get("reason"), current_username())
    except (KeyError, ValueError) as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"item": item})


@task_blueprint.delete("/api/task-system/tasks/<int:task_id>")
@login_required
def delete_task_item(task_id: int):
    try:
        delete_task(task_id, current_username())
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"message": "任务已删除。"})


@task_blueprint.get("/api/task-system/reports")
@login_required
def task_reports():
    return jsonify(get_report_summary())


@task_blueprint.get("/api/task-system/reminders")
@login_required
def task_reminders():
    return jsonify(get_reminders(current_username()))


@task_blueprint.post("/api/task-system/export")
@login_required
def export_task_records():
    payload = request.get_json(silent=True) or {}
    try:
        buffer, filename, mimetype = export_task_data(
            payload.get("type", "handover"),
            payload.get("format", "excel"),
            payload.get("filters") or {},
        )
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400

    return send_file(
        buffer,
        as_attachment=True,
        download_name=filename,
        mimetype=mimetype,
    )


@task_blueprint.get("/api/task-system/attachments/<int:attachment_id>")
@login_required
def download_task_attachment(attachment_id: int):
    try:
        payload = get_attachment_file(attachment_id)
    except KeyError:
        return jsonify({"message": "附件不存在。"}), 404
    return send_file(
        payload["path"],
        as_attachment=True,
        download_name=payload["filename"],
        mimetype=payload["contentType"],
    )


@task_blueprint.get("/api/task-system/attachments/<int:attachment_id>/preview")
@login_required
def preview_task_attachment(attachment_id: int):
    try:
        payload = get_attachment_file(attachment_id)
    except KeyError:
        return jsonify({"message": "附件不存在。"}), 404
    content_type = str(payload["contentType"] or "")
    filename = str(payload["filename"] or "").lower()
    image_extensions = (".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg")
    if not content_type.startswith("image/") and not filename.endswith(image_extensions):
        return jsonify({"message": "该附件不是图片，无法预览。"}), 400
    preview_mimetype = content_type if content_type.startswith("image/") else mimetypes.guess_type(filename)[0]
    return send_file(
        payload["path"],
        as_attachment=False,
        mimetype=preview_mimetype or payload["contentType"],
    )


def _read_payload() -> dict:
    raw_payload = request.form.get("payload")
    if raw_payload is not None:
        try:
            return json.loads(raw_payload)
        except json.JSONDecodeError as exc:
            raise ValueError("请求数据格式错误。") from exc
    return request.get_json(silent=True) or {}
