from __future__ import annotations

import json
from datetime import datetime, time, timedelta
from pathlib import Path
from typing import Any
from uuid import uuid4

from werkzeug.utils import secure_filename

from fab_app.config import BASE_DIR
from fab_app.repositories import task_repository, user_repository


DEFAULT_SHIFT_GROUPS = (
    {"name": "早班", "start_time": "08:00", "end_time": "16:00", "sort_order": 1},
    {"name": "中班", "start_time": "16:00", "end_time": "00:00", "sort_order": 2},
    {"name": "晚班", "start_time": "00:00", "end_time": "08:00", "sort_order": 3},
)

DEFAULT_SETTINGS = {
    "notifications.handover_minutes": 30,
    "notifications.task_due_hours": 24,
    "permissions.assign_admin": True,
}

TASK_STATUSES = ("未开始", "进行中", "待审核", "已完成", "已驳回")
TASK_PRIORITIES = ("低", "中", "高")
OPERATION_ACTIONS = ("增加", "修改", "删除", "查看")
UPLOAD_ROOT = BASE_DIR / "storage" / "uploads"
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


def ensure_task_system_store() -> None:
    task_repository.ensure_task_tables()
    _seed_shift_groups()
    _seed_departments()
    _seed_settings()
    _migrate_person_fields_to_usernames()


def get_task_system_payload(username: str) -> dict[str, Any]:
    user_profile = get_user_summary(username)
    handovers = list_handover_records({})
    tasks = list_tasks({}, handovers=handovers)
    return {
        "currentUser": user_profile,
        "users": list_users(),
        "shifts": list_shift_groups(),
        "floors": list_floors(),
        "departments": list_departments(),
        "settings": get_system_settings(),
        "handovers": handovers,
        "tasks": tasks,
        "reports": get_report_summary(handovers, tasks),
        "reminders": get_reminders(username, tasks, handovers),
        "operationLogs": list_operation_logs({}) if int(user_profile.get("permissionLevel") or 1) >= 5 else [],
        "operationActions": list(OPERATION_ACTIONS),
        "statusOptions": list(TASK_STATUSES),
        "priorityOptions": list(TASK_PRIORITIES),
    }


def list_users() -> list[dict[str, Any]]:
    return [_build_user_summary(row) for row in user_repository.fetch_all_users()]


def get_user_summary(username: str) -> dict[str, Any]:
    row = user_repository.fetch_user(_normalize_text(username))
    if not row:
        raise KeyError(username)
    return _build_user_summary(row)


def save_user(payload: dict[str, Any], actor_username: str) -> dict[str, Any]:
    now = _now_text()
    username = _normalize_text(payload.get("username"))
    if not username:
        raise ValueError("工号不能为空")

    existing = user_repository.fetch_user(username)
    is_update = bool(existing)
    requested_role = _normalize_role(payload.get("role"))
    actor_is_super_admin = _actor_is_super_admin(actor_username)
    role = requested_role if actor_is_super_admin else "user"
    if existing:
        existing_role = _normalize_role(existing["role"])
        role = requested_role if actor_is_super_admin else existing_role
    user_payload = {
        "display_name": _normalize_text(payload.get("displayName")),
        "department": _normalize_text(payload.get("department")),
        "email": _normalize_text(payload.get("email")),
        "phone": _normalize_text(payload.get("phone")),
        "supervisor_user": _normalize_text(payload.get("supervisorUser")),
        "role": role,
        "updated_at": now,
    }

    if existing:
        if payload.get("password"):
            user_payload["password"] = str(payload["password"]).strip()
        user_repository.update_user_by_username(username, user_payload)
    else:
        password = str(payload.get("password") or "").strip()
        if not password:
            raise ValueError("新建用户时必须设置密码")
        user_repository.insert_user(
            {
                "user": username,
                "password": password,
                "display_name": user_payload["display_name"],
                "email": user_payload["email"],
                "phone": user_payload["phone"],
                "department": user_payload["department"],
                "supervisor_user": user_payload["supervisor_user"],
                "role": role,
                "is_active": 1,
                "shift_group_id": None,
                "created_at": now,
                "updated_at": now,
            }
        )

    item = get_user_summary(username)
    _safe_record_operation(
        actor_username,
        "用户管理",
        "修改" if is_update else "增加",
        _user_operation_label(item),
        item["id"],
    )
    return item


def assign_user_permission(
    target_username: str,
    role: str,
    actor_username: str,
) -> dict[str, Any]:
    if not _actor_is_super_admin(actor_username):
        raise ValueError("只有超级管理员可以赋予用户权限")

    username = _normalize_text(target_username)
    if not username:
        raise ValueError("工号不能为空")

    existing = user_repository.fetch_user(username)
    if not existing:
        raise ValueError("用户不存在")

    normalized_role = _normalize_role(role)
    if username == _normalize_text(actor_username) and normalized_role != "admin":
        raise ValueError("不能降低当前超级管理员自己的权限")

    user_repository.update_user_by_username(
        username,
        {
            "role": normalized_role,
            "updated_at": _now_text(),
        },
    )
    item = get_user_summary(username)
    _safe_record_operation(
        actor_username,
        "用户管理",
        "修改",
        f"权限赋予 / {_user_operation_label(item)} / {item['role']}",
        item["id"],
    )
    return item


def list_shift_groups() -> list[dict[str, Any]]:
    return [_build_shift_summary(row) for row in task_repository.fetch_all_shift_groups()]


def list_floors() -> list[dict[str, Any]]:
    return [_build_floor_summary(row) for row in task_repository.fetch_all_floors()]


def list_departments() -> list[dict[str, Any]]:
    return [_build_department_summary(row) for row in task_repository.fetch_all_departments()]


def save_shift_group(payload: dict[str, Any], actor_username: str | None = None) -> dict[str, Any]:
    now = _now_text()
    shift_payload = {
        "name": _normalize_text(payload.get("name")),
        "start_time": _normalize_time_text(payload.get("startTime")),
        "end_time": _normalize_time_text(payload.get("endTime")),
        "sort_order": _safe_int(payload.get("sortOrder")) or 0,
        "is_active": 1,
        "updated_at": now,
    }
    if not shift_payload["name"]:
        raise ValueError("班次名称不能为空")
    if not shift_payload["start_time"] or not shift_payload["end_time"]:
        raise ValueError("班次时间不能为空")

    shift_group_id = _safe_int(payload.get("id"))
    is_update = bool(shift_group_id)
    if shift_group_id:
        task_repository.update_shift_group(shift_group_id, shift_payload)
    else:
        shift_group_id = task_repository.insert_shift_group(
            {**shift_payload, "created_at": now}
        )
    item = next(
        item for item in list_shift_groups() if item["id"] == shift_group_id
    )
    _safe_record_operation(
        actor_username,
        "系统设置-班次",
        "修改" if is_update else "增加",
        _setting_operation_label(item, "班次"),
        item["id"],
    )
    return item


def delete_shift_group(shift_group_id: int, actor_username: str | None = None) -> None:
    existing = task_repository.fetch_shift_group(shift_group_id)
    if not existing:
        raise ValueError("班次不存在")
    task_repository.delete_shift_group(shift_group_id)
    _safe_record_operation(
        actor_username,
        "系统设置-班次",
        "删除",
        f"#{shift_group_id} / 班次 / {_normalize_text(existing['name'])}",
        shift_group_id,
    )


def save_floor(payload: dict[str, Any], actor_username: str | None = None) -> dict[str, Any]:
    now = _now_text()
    floor_payload = {
        "name": _normalize_text(payload.get("name")),
        "sort_order": _safe_int(payload.get("sortOrder")) or 0,
        "created_at": now,
        "updated_at": now,
    }
    if not floor_payload["name"]:
        raise ValueError("楼层名称不能为空")
    if task_repository.fetch_floor_by_name(floor_payload["name"]):
        raise ValueError("楼层名称已存在")

    floor_id = task_repository.insert_floor(floor_payload)
    item = next(item for item in list_floors() if item["id"] == floor_id)
    _safe_record_operation(
        actor_username,
        "系统设置-楼层",
        "增加",
        _setting_operation_label(item, "楼层"),
        item["id"],
    )
    return item


def delete_floor(floor_id: int, actor_username: str | None = None) -> None:
    existing = task_repository.fetch_floor(floor_id)
    if not existing:
        raise ValueError("楼层不存在")
    task_repository.delete_floor(floor_id)
    _safe_record_operation(
        actor_username,
        "系统设置-楼层",
        "删除",
        f"#{floor_id} / 楼层 / {_normalize_text(existing['name'])}",
        floor_id,
    )


def save_department(payload: dict[str, Any], actor_username: str | None = None) -> dict[str, Any]:
    now = _now_text()
    department_payload = {
        "name": _normalize_text(payload.get("name")),
        "sort_order": _safe_int(payload.get("sortOrder")) or 0,
        "created_at": now,
        "updated_at": now,
    }
    if not department_payload["name"]:
        raise ValueError("部门名称不能为空")
    if task_repository.fetch_department_by_name(department_payload["name"]):
        raise ValueError("部门名称已存在")

    department_id = task_repository.insert_department(department_payload)
    item = next(item for item in list_departments() if item["id"] == department_id)
    _safe_record_operation(
        actor_username,
        "系统设置-部门",
        "增加",
        _setting_operation_label(item, "部门"),
        item["id"],
    )
    return item


def delete_department(department_id: int, actor_username: str | None = None) -> None:
    existing = task_repository.fetch_department(department_id)
    if not existing:
        raise ValueError("部门不存在")
    task_repository.delete_department(department_id)
    _safe_record_operation(
        actor_username,
        "系统设置-部门",
        "删除",
        f"#{department_id} / 部门 / {_normalize_text(existing['name'])}",
        department_id,
    )


def get_system_settings() -> dict[str, Any]:
    raw_settings = task_repository.fetch_setting_map()
    settings = {}
    for key, default_value in DEFAULT_SETTINGS.items():
        raw_value = raw_settings.get(key)
        if raw_value is None:
            settings[key] = default_value
            continue
        settings[key] = _parse_setting_value(raw_value, default_value)
    return settings


def list_operation_logs(filters: dict[str, Any]) -> list[dict[str, Any]]:
    operator = _normalize_text(filters.get("operator")).lower()
    date_from = _normalize_text(filters.get("dateFrom"))
    date_to = _normalize_text(filters.get("dateTo"))
    action_type = _normalize_text(filters.get("actionType"))
    rows = []
    for row in task_repository.fetch_all_operation_logs():
        item = _build_operation_log_summary(row)
        if operator:
            operator_haystack = " ".join([item["operatorUser"], item["operatorLabel"]]).lower()
            if operator not in operator_haystack:
                continue
        if date_from and item["operatedAt"][:10] < date_from:
            continue
        if date_to and item["operatedAt"][:10] > date_to:
            continue
        if action_type and item["actionType"] != action_type:
            continue
        rows.append(item)
    return rows


def record_operation(
    operator_username: str,
    page_name: str,
    action_type: str,
    record_label: str,
    record_id: Any = "",
) -> dict[str, Any]:
    normalized_action = _normalize_text(action_type)
    if normalized_action not in OPERATION_ACTIONS:
        raise ValueError("操作功能类型无效")
    normalized_page_name = _normalize_text(page_name)
    if not normalized_page_name:
        raise ValueError("操作页面不能为空")
    normalized_record_label = _normalize_text(record_label)
    if not normalized_record_label:
        raise ValueError("操作记录不能为空")

    try:
        operator_profile = get_user_summary(operator_username)
    except KeyError:
        operator_profile = {
            "username": _normalize_text(operator_username),
            "displayLabel": _normalize_text(operator_username) or "未知用户",
        }

    payload = {
        "operator_user": _normalize_text(operator_profile.get("username")) or _normalize_text(operator_username),
        "operator_label": _normalize_text(operator_profile.get("displayLabel")) or _normalize_text(operator_username),
        "operated_at": _now_text(),
        "page_name": normalized_page_name,
        "action_type": normalized_action,
        "record_label": normalized_record_label,
        "record_id": _normalize_text(record_id),
    }
    operation_id = task_repository.insert_operation_log(payload)
    return _build_operation_log_summary({**payload, "id": operation_id})


def list_handover_records(filters: dict[str, Any]) -> list[dict[str, Any]]:
    shifts = list_shift_groups()
    shifts_by_id = {item["id"]: item for item in shifts}
    floors_by_id = {item["id"]: item for item in list_floors()}
    attachments_by_owner = _build_attachment_lookup("handover")
    records = []
    keyword = _normalize_text(filters.get("keyword")).lower()
    date_from = _normalize_text(filters.get("dateFrom"))
    date_to = _normalize_text(filters.get("dateTo"))
    shift_group_id = _safe_int(filters.get("shiftGroupId"))
    handover_user = _normalize_text(filters.get("handoverUser"))
    receiver_user = _normalize_text(filters.get("receiverUser"))

    for row in task_repository.fetch_all_handover_records():
        record = _build_handover_summary(row, shifts, shifts_by_id, floors_by_id, attachments_by_owner)
        if date_from and record["recordTime"][:10] < date_from:
            continue
        if date_to and record["recordTime"][:10] > date_to:
            continue
        if shift_group_id and record["shiftGroupId"] != shift_group_id:
            continue
        if handover_user and not _matches_person_filter(record.get("handoverUserId") or record["handoverUser"], handover_user):
            continue
        if receiver_user and not _matches_person_filter(record.get("receiverUserId") or record["receiverUser"], receiver_user):
            continue
        if keyword:
            haystack = " ".join(
                [
                    record["title"],
                    record["shiftName"],
                    record["receiverShiftName"],
                    record["floorName"],
                    record["handoverUser"],
                    record["receiverUser"],
                    record["receiverSupervisorLabel"],
                    record["mentionUserLabels"],
                    record["workSummary"],
                    record["precautions"],
                    record["pendingItems"],
                    record["keywords"],
                ]
            ).lower()
            if keyword not in haystack:
                continue
        records.append(record)
    return records


def save_handover_record(
    payload: dict[str, Any],
    files,
    actor_username: str,
) -> dict[str, Any]:
    now = _now_text()
    record_payload = {
        "title": _normalize_text(payload.get("title")) or "交接班记录",
        "shift_group_id": _safe_int(payload.get("shiftGroupId")),
        "floor_id": _safe_int(payload.get("floorId")),
        "handover_user": _resolve_person_username(payload.get("handoverUser")) or _normalize_text(actor_username),
        "receiver_user": _resolve_person_username(payload.get("receiverUser")),
        "work_summary": _normalize_text(payload.get("workSummary")),
        "precautions": _normalize_text(payload.get("precautions")),
        "pending_items": _normalize_text(payload.get("pendingItems")),
        "keywords": _normalize_text(payload.get("keywords")),
        "mention_users": _serialize_mention_users(payload.get("mentionUsers")),
        "updated_at": now,
    }
    if not record_payload["receiver_user"]:
        raise ValueError("接班人不能为空")
    if not record_payload["floor_id"]:
        raise ValueError("楼层不能为空")

    record_id = _safe_int(payload.get("id"))
    is_update = bool(record_id)
    if record_id:
        if not task_repository.fetch_handover_record(record_id):
            raise ValueError("交接班记录不存在")
        task_repository.update_handover_record(
            record_id,
            {
                **record_payload,
            },
        )
    else:
        record_id = task_repository.insert_handover_record(
            {
                **record_payload,
                "record_time": now,
                "created_by": actor_username,
                "created_at": now,
            }
        )

    _store_attachments(files, "handover", record_id, actor_username)
    item = next(item for item in list_handover_records({}) if item["id"] == record_id)
    _safe_record_operation(
        actor_username,
        "交接班记录",
        "修改" if is_update else "增加",
        _handover_operation_label(item),
        item["id"],
    )
    return item


def delete_handover_record(record_id: int, actor_username: str | None = None) -> None:
    existing = task_repository.fetch_handover_record(record_id)
    if not existing:
        raise ValueError("交接班记录不存在")
    attachments = task_repository.fetch_attachments_for_owner("handover", record_id)
    task_repository.delete_handover_record(record_id)
    _delete_attachment_files(attachments)
    _safe_record_operation(
        actor_username,
        "交接班记录",
        "删除",
        f"#{record_id} / {_normalize_text(existing['keywords']) or _normalize_text(existing['title']) or _normalize_text(existing['receiver_user'])}",
        record_id,
    )


def list_tasks(filters: dict[str, Any], handovers: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    attachments_by_owner = _build_attachment_lookup("task")
    submission_attachments_by_owner = _build_attachment_lookup("task_submission")
    latest_submission_by_task = _build_latest_task_submission_lookup()
    reviews_by_submission = _build_task_review_lookup()
    handover_rows = handovers if handovers is not None else list_handover_records({})
    handover_supervisors = {
        item["id"]: item["receiverSupervisorLabel"]
        for item in handover_rows
    }
    keyword = _normalize_text(filters.get("keyword")).lower()
    status = _normalize_text(filters.get("status"))
    assignee_user = _normalize_text(filters.get("assigneeUser"))
    handover_record_id = _safe_int(filters.get("handoverRecordId"))
    tasks = []

    for row in task_repository.fetch_all_tasks():
        latest_submission = latest_submission_by_task.get(int(row["id"]))
        task = _build_task_summary(
            row,
            attachments_by_owner,
            latest_submission,
            reviews_by_submission,
            submission_attachments_by_owner,
        )
        task["supervisorLabel"] = handover_supervisors.get(task["handoverRecordId"], "")
        if status and task["status"] != status:
            continue
        if assignee_user and not _matches_person_filter(task.get("assigneeUserId") or task["assigneeUser"], assignee_user):
            continue
        if handover_record_id and task["handoverRecordId"] != handover_record_id:
            continue
        if keyword:
            haystack = " ".join(
                [
                    task["title"],
                    task["description"],
                    task["status"],
                    task["priority"],
                    task["assigneeUser"],
                    task["creatorUser"],
                    task["supervisorLabel"],
                    task["mentionUserLabels"],
                    task["rejectReason"],
                    task["rejectedBy"],
                    task["reviewStatusLabel"],
                    task["reviewGrade"],
                    _normalize_text(task.get("reviewAverageScore")),
                    _normalize_text((task.get("reviewSubmission") or {}).get("content")),
                    _normalize_text((task.get("reviewSubmission") or {}).get("reviewerLabels")),
                ]
            ).lower()
            if keyword not in haystack:
                continue
        tasks.append(task)
    return tasks


def save_task(payload: dict[str, Any], files, actor_username: str) -> dict[str, Any]:
    now = _now_text()
    status = _normalize_text(payload.get("status")) or "未开始"
    if status not in TASK_STATUSES:
        raise ValueError("任务状态无效")
    priority = _normalize_text(payload.get("priority")) or "中"
    if priority not in TASK_PRIORITIES:
        raise ValueError("任务优先级无效")

    start_at = _normalize_datetime_text(payload.get("startAt"))
    due_at = _normalize_datetime_text(payload.get("dueAt"))
    if start_at and due_at and _parse_datetime(due_at) < _parse_datetime(start_at):
        raise ValueError("到期时间不能早于开始时间")
    task_payload = {
        "title": _normalize_text(payload.get("title")),
        "description": _normalize_text(payload.get("description")),
        "status": status,
        "priority": priority,
        "start_at": start_at,
        "due_at": due_at,
        "assignee_user": _resolve_person_username(payload.get("assigneeUser")),
        "mention_users": _serialize_mention_users(payload.get("mentionUsers")),
        "handover_record_id": _safe_int(payload.get("handoverRecordId")),
        "reminder_at": None,
        "updated_at": now,
        "completed_at": now if status == "已完成" else None,
        "reject_reason": _normalize_text(payload.get("rejectReason")) if status == "已驳回" else "",
        "rejected_by": _resolve_person_username(payload.get("rejectedBy")) if status == "已驳回" else "",
        "rejected_at": _normalize_datetime_text(payload.get("rejectedAt")) if status == "已驳回" else "",
    }
    if not task_payload["title"]:
        raise ValueError("任务标题不能为空")

    task_id = _safe_int(payload.get("id"))
    is_update = bool(task_id)
    if task_id:
        existing = task_repository.fetch_task(task_id)
        if not existing:
            raise KeyError(task_id)
        if not _can_actor_edit_task(existing, actor_username):
            raise ValueError("你没有权限编辑该任务")
        if status == "已驳回" and not task_payload["reject_reason"]:
            task_payload["reject_reason"] = _normalize_text(existing["reject_reason"])
            task_payload["rejected_by"] = _normalize_text(existing["rejected_by"])
            task_payload["rejected_at"] = _normalize_text(existing["rejected_at"])
        if status == "已驳回" and not task_payload["reject_reason"]:
            raise ValueError("驳回理由不能为空，请使用驳回按钮填写理由")
        if status == "已完成" and not existing["completed_at"]:
            task_payload["completed_at"] = now
        elif status != "已完成":
            task_payload["completed_at"] = None
        if status != "已驳回":
            task_payload["reject_reason"] = ""
            task_payload["rejected_by"] = ""
            task_payload["rejected_at"] = ""
        task_repository.update_task(task_id, task_payload)
    else:
        if status == "已驳回" and not task_payload["reject_reason"]:
            raise ValueError("驳回理由不能为空，请使用驳回按钮填写理由")
        task_id = task_repository.insert_task(
            {
                **task_payload,
                "creator_user": actor_username,
                "created_at": now,
            }
        )

    _store_attachments(files, "task", task_id, actor_username)
    item = next(item for item in list_tasks({}) if item["id"] == task_id)
    _safe_record_operation(
        actor_username,
        "任务清单",
        "修改" if is_update else "增加",
        _task_operation_label(item),
        item["id"],
    )
    return item


def claim_task(task_id: int, actor_username: str) -> dict[str, Any]:
    existing = task_repository.fetch_task(task_id)
    if not existing:
        raise ValueError("任务不存在")
    status = _normalize_text(existing["status"])
    if status == "已完成":
        raise ValueError("已完成任务不能领取")
    if status == "已驳回":
        raise ValueError("已驳回任务不能领取")
    if status == "待审核":
        raise ValueError("待审核任务不能领取")
    if not _is_actor_task_assignee(existing, actor_username):
        raise ValueError("只有任务负责人可以领取该任务")

    now = _now_text()
    task_repository.update_task(
        task_id,
        {
            "assignee_user": _normalize_text(actor_username),
            "status": "进行中",
            "updated_at": now,
            "completed_at": None,
            "reject_reason": "",
            "rejected_by": "",
            "rejected_at": "",
        },
    )
    item = next(item for item in list_tasks({}) if item["id"] == task_id)
    _safe_record_operation(
        actor_username,
        "任务清单",
        "修改",
        f"领取 / {_task_operation_label(item)}",
        item["id"],
    )
    return item


def reject_task(task_id: int, reason: str, actor_username: str) -> dict[str, Any]:
    existing = task_repository.fetch_task(task_id)
    if not existing:
        raise ValueError("任务不存在")
    reject_reason = _normalize_text(reason)
    if not reject_reason:
        raise ValueError("驳回理由不能为空")
    if _normalize_text(existing["status"]) == "已完成":
        raise ValueError("已完成任务不能驳回")
    if _normalize_text(existing["status"]) == "已驳回":
        raise ValueError("已驳回任务不能重复驳回")
    if _normalize_text(existing["status"]) == "待审核":
        raise ValueError("待审核任务请通过评分审核")
    if not (_is_actor_task_assignee(existing, actor_username) or _actor_has_level5(actor_username)):
        raise ValueError("只有任务负责人或 5 级权限者可以驳回该任务")

    now = _now_text()
    task_repository.update_task(
        task_id,
        {
            "status": "已驳回",
            "reject_reason": reject_reason,
            "rejected_by": _normalize_text(actor_username),
            "rejected_at": now,
            "updated_at": now,
            "completed_at": None,
        },
    )
    item = next(item for item in list_tasks({}) if item["id"] == task_id)
    _safe_record_operation(
        actor_username,
        "任务清单",
        "修改",
        f"驳回 / {_task_operation_label(item)}",
        item["id"],
    )
    return item


def submit_task_for_review(
    task_id: int,
    payload: dict[str, Any],
    files,
    actor_username: str,
) -> dict[str, Any]:
    existing = task_repository.fetch_task(task_id)
    if not existing:
        raise ValueError("任务不存在")
    if _normalize_text(existing["status"]) != "进行中":
        raise ValueError("只有进行中的任务可以提交审核")
    if not _is_actor_task_assignee(existing, actor_username):
        raise ValueError("只有任务负责人可以提交审核")

    content = _normalize_text(payload.get("content"))
    if not content:
        raise ValueError("提交内容不能为空")

    now = _now_text()
    submission_id = task_repository.insert_task_submission(
        {
            "task_id": task_id,
            "submitter_user": _normalize_text(actor_username),
            "content": content,
            "status": "pending",
            "average_score": None,
            "grade": "",
            "submitted_at": now,
            "reviewed_at": "",
            "updated_at": now,
        }
    )
    _store_attachments(files, "task_submission", submission_id, actor_username)
    task_repository.update_task(
        task_id,
        {
            "status": "待审核",
            "updated_at": now,
            "completed_at": None,
            "reject_reason": "",
            "rejected_by": "",
            "rejected_at": "",
        },
    )
    item = next(item for item in list_tasks({}) if item["id"] == task_id)
    _safe_record_operation(
        actor_username,
        "任务清单",
        "修改",
        f"提交审核 / {_task_operation_label(item)}",
        item["id"],
    )
    return item


def review_task_submission(task_id: int, payload: dict[str, Any], actor_username: str) -> dict[str, Any]:
    existing = task_repository.fetch_task(task_id)
    if not existing:
        raise ValueError("任务不存在")
    if _normalize_text(existing["status"]) != "待审核":
        raise ValueError("只有待审核任务可以评分")

    submission = task_repository.fetch_latest_task_submission(task_id)
    if not submission or _normalize_text(submission["status"]) != "pending":
        raise ValueError("当前任务没有待审核提交")

    reviewer_username = _normalize_text(actor_username)
    reviewers = _build_task_reviewers_from_row(existing)
    reviewer_usernames = {item["username"] for item in reviewers if item.get("username")}
    if reviewer_username not in reviewer_usernames:
        raise ValueError("只有任务发布人和 @ 人员可以评分")

    score = _normalize_score(payload.get("score"))
    comment = _normalize_text(payload.get("comment"))
    now = _now_text()
    task_repository.upsert_task_review(
        {
            "submission_id": int(submission["id"]),
            "task_id": task_id,
            "reviewer_user": reviewer_username,
            "score": score,
            "comment": comment,
            "reviewed_at": now,
        }
    )

    reviews = task_repository.fetch_reviews_for_submission(int(submission["id"]))
    review_scores = {
        _normalize_text(row["reviewer_user"]): float(row["score"])
        for row in reviews
    }
    required_scores = [
        review_scores[item["username"]]
        for item in reviewers
        if item.get("username") in review_scores
    ]
    if len(required_scores) >= len(reviewers):
        average_score = round(sum(required_scores) / len(required_scores), 2)
        grade = _get_review_grade(average_score)
        passed = average_score >= 60
        task_repository.update_task_submission(
            int(submission["id"]),
            {
                "status": "passed" if passed else "failed",
                "average_score": average_score,
                "grade": grade,
                "reviewed_at": now,
                "updated_at": now,
            },
        )
        task_repository.update_task(
            task_id,
            {
                "status": "已完成" if passed else "进行中",
                "updated_at": now,
                "completed_at": now if passed else None,
            },
        )
    else:
        task_repository.update_task_submission(
            int(submission["id"]),
            {
                "updated_at": now,
            },
        )

    item = next(item for item in list_tasks({}) if item["id"] == task_id)
    _safe_record_operation(
        actor_username,
        "任务清单",
        "修改",
        f"审核评分 {score:g} / {_task_operation_label(item)}",
        item["id"],
    )
    return item


def delete_task(task_id: int, actor_username: str | None = None) -> None:
    existing = task_repository.fetch_task(task_id)
    if not existing:
        raise ValueError("任务不存在")
    if actor_username and not _can_actor_edit_task(existing, actor_username):
        raise ValueError("你没有权限删除该任务")
    attachments = list(task_repository.fetch_attachments_for_owner("task", task_id))
    for submission in task_repository.fetch_all_task_submissions():
        if int(submission["task_id"]) != int(task_id):
            continue
        attachments.extend(
            task_repository.fetch_attachments_for_owner("task_submission", int(submission["id"]))
        )
    task_repository.delete_task(task_id)
    _delete_attachment_files(attachments)
    _safe_record_operation(
        actor_username,
        "任务清单",
        "删除",
        f"#{task_id} / {_normalize_text(existing['title'])}",
        task_id,
    )


def get_report_summary(
    handovers: list[dict[str, Any]] | None = None,
    tasks: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    handovers = handovers if handovers is not None else list_handover_records({})
    tasks = tasks if tasks is not None else list_tasks({}, handovers=handovers)
    tasks_by_status = {status: 0 for status in TASK_STATUSES}
    for task in tasks:
        tasks_by_status[task["status"]] = tasks_by_status.get(task["status"], 0) + 1

    handovers_by_shift: dict[str, int] = {}
    for record in handovers:
        handovers_by_shift[record["shiftName"]] = handovers_by_shift.get(record["shiftName"], 0) + 1

    return {
        "handoverCount": len(handovers),
        "taskCount": len(tasks),
        "completedTaskCount": tasks_by_status.get("已完成", 0),
        "openTaskCount": tasks_by_status.get("未开始", 0) + tasks_by_status.get("进行中", 0) + tasks_by_status.get("待审核", 0),
        "tasksByStatus": tasks_by_status,
        "handoversByShift": handovers_by_shift,
    }


def get_reminders(
    username: str | None = None,
    tasks: list[dict[str, Any]] | None = None,
    handovers: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    now = datetime.now()
    user_values = _get_user_identity_values(username)
    tasks = tasks if tasks is not None else list_tasks({})
    handovers = handovers if handovers is not None else list_handover_records({})

    due_tasks = []
    for task in tasks:
        if task["status"] in {"待审核", "已完成", "已驳回"}:
            continue
        related_by_assignee = _is_user_related_to_values(
            user_values,
            task.get("assigneeUserId") or task.get("assigneeUser"),
        )
        related_by_mention = _is_user_related_to_any(user_values, task.get("mentionUsers"))
        related_by_text_mention = _is_user_mentioned(
            user_values,
            task.get("title"),
            task.get("description"),
        )
        if not (related_by_assignee or related_by_mention or related_by_text_mention):
            continue

        if task["status"] == "进行中":
            if not task["dueAt"]:
                continue
            due_at = _parse_datetime(task["dueAt"])
            minutes_until = int((due_at - now).total_seconds() // 60)
            due_tasks.append(
                {
                    **task,
                    "reminderId": f"task-due:{task['id']}:{task['dueAt']}",
                    "reminderType": "task",
                    "reminderKind": "due",
                    "reminderTitle": f"{task['title']} 到期提醒",
                    "reminderTime": task["dueAt"],
                    "timeLabel": "到期时间",
                    "minutesUntil": minutes_until,
                    "remainingText": _format_remaining_text(minutes_until),
                }
            )
            continue

        if not task["startAt"]:
            continue
        start_at = _parse_datetime(task["startAt"])
        if start_at < now:
            continue
        minutes_until = int((start_at - now).total_seconds() // 60)
        due_tasks.append(
            {
                **task,
                "reminderId": f"task-start:{task['id']}:{task['startAt']}",
                "reminderType": "task",
                "reminderKind": "start",
                "reminderTitle": task["title"],
                "reminderTime": task["startAt"],
                "timeLabel": "开始时间",
                "minutesUntil": minutes_until,
                "remainingText": _format_remaining_text(minutes_until),
            }
        )

    shift_reminders = []
    shifts_by_id = {item["id"]: item for item in list_shift_groups()}
    for record in handovers:
        related_by_receiver = _is_user_related_to_values(
            user_values,
            record.get("receiverUserId") or record.get("receiverUser"),
        )
        related_by_mention = _is_user_related_to_any(user_values, record.get("mentionUsers"))
        related_by_text_mention = _is_user_mentioned(
            user_values,
            record.get("workSummary"),
            record.get("precautions"),
            record.get("pendingItems"),
            record.get("keywords"),
        )
        if not (related_by_receiver or related_by_mention or related_by_text_mention):
            continue
        receiver_shift = shifts_by_id.get(record.get("receiverShiftGroupId"))
        if not receiver_shift:
            continue
        record_reference = _parse_datetime(record.get("createdAt") or record.get("recordTime"))
        next_start = _get_next_shift_datetime(receiver_shift["startTime"], record_reference)
        if next_start < now:
            continue
        minutes_until = int((next_start - now).total_seconds() // 60)
        shift_reminders.append(
            {
                "reminderId": f"handover:{record['id']}:{next_start.isoformat(timespec='minutes')}",
                "reminderType": "handover",
                "reminderTitle": f"{record['receiverShiftName']}接班提醒",
                "handoverRecordId": record["id"],
                "shiftName": record["shiftName"],
                "receiverShiftName": record["receiverShiftName"],
                "handoverUser": record["handoverUser"],
                "receiverUser": record["receiverUser"],
                "keywords": record["keywords"],
                "startTime": next_start.isoformat(timespec="minutes"),
                "minutesUntil": minutes_until,
                "remainingText": _format_remaining_text(minutes_until),
            }
        )

    review_notifications = []
    for task in tasks:
        submission = task.get("reviewSubmission") or {}
        submission_id = submission.get("id")
        submission_status = _normalize_text(submission.get("status"))
        if not submission_id or not submission_status:
            continue

        related_by_assignee = _is_user_related_to_values(
            user_values,
            task.get("assigneeUserId") or task.get("assigneeUser"),
        )
        reviewer = next(
            (
                item
                for item in submission.get("reviewers", [])
                if _is_user_related_to_values(user_values, item.get("username") or item.get("label"))
            ),
            None,
        )

        if submission_status == "pending":
            if related_by_assignee:
                review_notifications.append(
                    {
                        "reminderId": f"task-review-pending:{submission_id}",
                        "reminderType": "task",
                        "reminderKind": "review-pending",
                        "reminderTitle": "任务状态为待审核",
                        "title": task["title"],
                        "taskId": task["id"],
                        "assigneeUser": task["assigneeUser"],
                        "reviewStatusLabel": submission.get("statusLabel"),
                        "reviewerLabels": submission.get("reviewerLabels"),
                        "reminderTime": submission.get("submittedAt"),
                        "description": f"任务 #{task['id']} 已提交审核，等待 {submission.get('reviewerLabels') or '审核人'} 评分。",
                    }
                )
            if reviewer and not reviewer.get("hasReviewed"):
                review_notifications.append(
                    {
                        "reminderId": f"task-review-needed:{submission_id}:{reviewer.get('username')}",
                        "reminderType": "task",
                        "reminderKind": "review-needed",
                        "reminderTitle": "任务待审核评分",
                        "title": task["title"],
                        "taskId": task["id"],
                        "assigneeUser": task["assigneeUser"],
                        "reviewStatusLabel": submission.get("statusLabel"),
                        "reviewerLabels": submission.get("reviewerLabels"),
                        "reminderTime": submission.get("submittedAt"),
                        "description": f"任务 #{task['id']} 由 {task['assigneeUser'] or '负责人'} 提交审核，请评分。",
                    }
                )
            continue

        if submission_status in {"passed", "failed"} and related_by_assignee:
            passed = submission_status == "passed"
            review_notifications.append(
                {
                    "reminderId": f"task-review-result:{submission_id}:{submission_status}",
                    "reminderType": "task",
                    "reminderKind": "review-result",
                    "reminderTitle": "任务审核通过" if passed else "任务审核未通过",
                    "title": task["title"],
                    "taskId": task["id"],
                    "assigneeUser": task["assigneeUser"],
                    "reviewStatusLabel": submission.get("statusLabel"),
                    "averageScore": submission.get("averageScore"),
                    "grade": submission.get("grade"),
                    "reminderTime": submission.get("reviewedAt") or submission.get("updatedAt") or submission.get("submittedAt"),
                    "description": (
                        f"平均分 {submission.get('averageScore')}，等级 {submission.get('grade') or '--'}。"
                        if passed
                        else f"平均分 {submission.get('averageScore')}，任务已退回进行中。"
                    ),
                }
            )

    return {
        "dueTasks": due_tasks[:10],
        "shiftReminders": shift_reminders,
        "reviewNotifications": review_notifications,
    }


def get_attachment_file(attachment_id: int) -> dict[str, Any]:
    row = task_repository.fetch_attachment(attachment_id)
    if not row:
        raise KeyError(attachment_id)
    return {
        "path": Path(row["stored_path"]),
        "filename": row["original_name"],
        "contentType": row["content_type"] or "application/octet-stream",
    }


def _seed_shift_groups() -> None:
    if task_repository.fetch_all_shift_groups():
        return
    now = _now_text()
    for item in DEFAULT_SHIFT_GROUPS:
        task_repository.insert_shift_group(
            {
                **item,
                "is_active": 1,
                "created_at": now,
                "updated_at": now,
            }
        )


def _seed_departments() -> None:
    if task_repository.fetch_all_departments():
        return

    department_names = []
    for row in user_repository.fetch_all_users():
        department_name = _normalize_text(row["department"])
        if department_name and department_name not in department_names:
            department_names.append(department_name)

    if not department_names:
        department_names = ["系统管理部", "AA PE", "AA生产一部", "OC PE", "设备维护"]

    now = _now_text()
    for index, name in enumerate(department_names, 1):
        task_repository.insert_department(
            {
                "name": name,
                "sort_order": index,
                "created_at": now,
                "updated_at": now,
            }
        )


def _seed_settings() -> None:
    existing = task_repository.fetch_setting_map()
    now = _now_text()
    for key, value in DEFAULT_SETTINGS.items():
        if key in existing:
            continue
        task_repository.upsert_setting(key, value, now, "system")


def _store_attachments(files, owner_type: str, owner_id: int, actor_username: str) -> None:
    if not files:
        return
    for storage in files:
        if not storage or not storage.filename:
            continue
        original_name = secure_filename(storage.filename) or f"attachment-{uuid4().hex}"
        folder = UPLOAD_ROOT / owner_type / datetime.now().strftime("%Y%m%d")
        folder.mkdir(parents=True, exist_ok=True)
        stored_name = f"{uuid4().hex}_{original_name}"
        stored_path = folder / stored_name
        storage.save(stored_path)
        task_repository.insert_attachment(
            {
                "owner_type": owner_type,
                "owner_id": owner_id,
                "original_name": original_name,
                "stored_name": stored_name,
                "stored_path": str(stored_path),
                "content_type": storage.content_type,
                "uploaded_by": actor_username,
                "uploaded_at": _now_text(),
            }
        )


def _delete_attachment_files(attachments) -> None:
    upload_root = UPLOAD_ROOT.resolve()
    for attachment in attachments:
        stored_path = _normalize_text(attachment["stored_path"])
        if not stored_path:
            continue
        try:
            file_path = Path(stored_path).resolve()
        except OSError:
            continue
        if file_path != upload_root and upload_root not in file_path.parents:
            continue
        try:
            file_path.unlink(missing_ok=True)
        except OSError:
            # The database row is already gone; leave locked files for manual cleanup.
            continue


def _build_attachment_lookup(owner_type: str) -> dict[int, list[dict[str, Any]]]:
    lookup: dict[int, list[dict[str, Any]]] = {}
    for item in task_repository.fetch_attachments_by_owner_type(owner_type):
        owner_id = int(item["owner_id"])
        lookup.setdefault(owner_id, []).append(
            {
                "id": item["id"],
                "originalName": item["original_name"],
                "contentType": item["content_type"] or "",
                "uploadedBy": item["uploaded_by"],
                "uploadedAt": item["uploaded_at"],
                "downloadUrl": f"/api/task-system/attachments/{item['id']}",
                "previewUrl": f"/api/task-system/attachments/{item['id']}/preview",
            }
        )
    return lookup


def _safe_record_operation(
    operator_username: str | None,
    page_name: str,
    action_type: str,
    record_label: str,
    record_id: Any = "",
) -> None:
    if not operator_username:
        return
    try:
        record_operation(operator_username, page_name, action_type, record_label, record_id)
    except Exception:
        # Operation logs should never block the user's actual business action.
        return


def _build_operation_log_summary(row) -> dict[str, Any]:
    operator_user = _build_person_reference(row["operator_user"] or row["operator_label"])
    return {
        "id": int(row["id"]),
        "operatorUser": operator_user["username"],
        "operatorLabel": operator_user["label"] or _normalize_text(row["operator_label"]),
        "operatedAt": _normalize_text(row["operated_at"]),
        "pageName": _normalize_text(row["page_name"]),
        "actionType": _normalize_text(row["action_type"]),
        "recordLabel": _normalize_text(row["record_label"]),
        "recordId": _normalize_text(row["record_id"]),
    }


def _handover_operation_label(record: dict[str, Any]) -> str:
    return " / ".join(
        item
        for item in [
            f"#{record.get('id')}",
            _normalize_text(record.get("keywords")),
            _normalize_text(record.get("floorName")),
            _normalize_text(record.get("receiverUser")),
        ]
        if item
    )


def _task_operation_label(record: dict[str, Any]) -> str:
    return " / ".join(
        item
        for item in [
            f"#{record.get('id')}",
            _normalize_text(record.get("title")),
            _normalize_text(record.get("assigneeUser")),
        ]
        if item
    )


def _user_operation_label(record: dict[str, Any]) -> str:
    return " / ".join(
        item
        for item in [
            f"#{record.get('id')}",
            _normalize_text(record.get("username")),
            _normalize_text(record.get("displayLabel") or record.get("displayName")),
        ]
        if item
    )


def _setting_operation_label(record: dict[str, Any], prefix: str) -> str:
    return " / ".join(
        item
        for item in [
            f"#{record.get('id')}",
            prefix,
            _normalize_text(record.get("name")),
        ]
        if item
    )


def _build_user_summary(row) -> dict[str, Any]:
    role = _normalize_role(row["role"])
    supervisor_user = _normalize_text(row["supervisor_user"])
    supervisor_row = user_repository.fetch_user(supervisor_user) if supervisor_user else None
    supervisor_display_name = _normalize_text(supervisor_row["display_name"]) if supervisor_row else ""
    return {
        "id": row["rowid"],
        "username": _normalize_text(row["user"]),
        "displayName": _normalize_text(row["display_name"]),
        "displayLabel": _normalize_text(row["display_name"]) or _normalize_text(row["user"]),
        "department": _normalize_text(row["department"]),
        "email": _normalize_text(row["email"]),
        "phone": _normalize_text(row["phone"]),
        "supervisorUser": supervisor_user,
        "supervisorLabel": supervisor_display_name or supervisor_user,
        "role": role,
        "permissionLevel": ROLE_PERMISSION_LEVELS.get(role, 1),
        "shiftGroupId": _safe_int(row["shift_group_id"]),
        "createdAt": _normalize_text(row["created_at"]),
        "updatedAt": _normalize_text(row["updated_at"]),
    }


def _build_shift_summary(row) -> dict[str, Any]:
    return {
        "id": int(row["id"]),
        "name": _normalize_text(row["name"]),
        "startTime": _normalize_text(row["start_time"]),
        "endTime": _normalize_text(row["end_time"]),
        "sortOrder": int(row["sort_order"] or 0),
        "isActive": bool(row["is_active"] if row["is_active"] is not None else 1),
    }


def _build_floor_summary(row) -> dict[str, Any]:
    return {
        "id": int(row["id"]),
        "name": _normalize_text(row["name"]),
        "sortOrder": int(row["sort_order"] or 0),
        "createdAt": _normalize_text(row["created_at"]),
        "updatedAt": _normalize_text(row["updated_at"]),
    }


def _build_department_summary(row) -> dict[str, Any]:
    return {
        "id": int(row["id"]),
        "name": _normalize_text(row["name"]),
        "sortOrder": int(row["sort_order"] or 0),
        "createdAt": _normalize_text(row["created_at"]),
        "updatedAt": _normalize_text(row["updated_at"]),
    }


def _build_handover_summary(
    row,
    shifts: list[dict[str, Any]],
    shifts_by_id: dict[int, dict[str, Any]],
    floors_by_id: dict[int, dict[str, Any]],
    attachments_by_owner: dict[int, list[dict[str, Any]]],
):
    shift_group_id = _safe_int(row["shift_group_id"])
    floor_id = _safe_int(row["floor_id"])
    shift = shifts_by_id.get(shift_group_id, {})
    receiver_shift = _get_next_shift(shift_group_id, shifts)
    floor = floors_by_id.get(floor_id, {})
    handover_user = _build_person_reference(row["handover_user"])
    receiver_user = _build_person_reference(row["receiver_user"])
    created_by = _build_person_reference(row["created_by"])
    supervisor = _get_supervisor_for_person(receiver_user["username"] or row["receiver_user"])
    mention_users = _parse_mention_users(row["mention_users"])
    return {
        "id": int(row["id"]),
        "title": _normalize_text(row["title"]),
        "shiftGroupId": shift_group_id,
        "shiftName": _normalize_text(shift.get("name")) or "--",
        "receiverShiftGroupId": receiver_shift.get("id"),
        "receiverShiftName": _normalize_text(receiver_shift.get("name")) or "--",
        "floorId": floor_id,
        "floorName": _normalize_text(floor.get("name")) or "--",
        "recordTime": _normalize_text(row["record_time"]),
        "handoverUserId": handover_user["username"],
        "handoverUser": handover_user["label"],
        "receiverUserId": receiver_user["username"],
        "receiverUser": receiver_user["label"],
        "receiverSupervisorUser": supervisor["username"],
        "receiverSupervisorLabel": supervisor["label"],
        "workSummary": _normalize_text(row["work_summary"]),
        "precautions": _normalize_text(row["precautions"]),
        "pendingItems": _normalize_text(row["pending_items"]),
        "keywords": _normalize_text(row["keywords"]),
        "mentionUsers": mention_users,
        "mentionUserLabels": _format_mention_user_labels(mention_users),
        "createdById": created_by["username"],
        "createdBy": created_by["label"],
        "createdAt": _normalize_text(row["created_at"]),
        "updatedAt": _normalize_text(row["updated_at"]),
        "attachments": attachments_by_owner.get(int(row["id"]), []),
    }


def _build_task_summary(
    row,
    attachments_by_owner: dict[int, list[dict[str, Any]]],
    latest_submission=None,
    reviews_by_submission: dict[int, list[Any]] | None = None,
    submission_attachments_by_owner: dict[int, list[dict[str, Any]]] | None = None,
):
    assignee_user = _build_person_reference(row["assignee_user"])
    creator_user = _build_person_reference(row["creator_user"])
    rejected_by = _build_person_reference(row["rejected_by"])
    mention_users = _parse_mention_users(row["mention_users"])
    review_submission = _build_task_submission_summary(
        latest_submission,
        row,
        reviews_by_submission or {},
        submission_attachments_by_owner or {},
    )
    return {
        "id": int(row["id"]),
        "title": _normalize_text(row["title"]),
        "description": _normalize_text(row["description"]),
        "status": _normalize_text(row["status"]),
        "priority": _normalize_text(row["priority"]),
        "startAt": _normalize_text(row["start_at"]),
        "dueAt": _normalize_text(row["due_at"]),
        "assigneeUserId": assignee_user["username"],
        "assigneeUser": assignee_user["label"],
        "mentionUsers": mention_users,
        "mentionUserLabels": _format_mention_user_labels(mention_users),
        "creatorUserId": creator_user["username"],
        "creatorUser": creator_user["label"],
        "handoverRecordId": _safe_int(row["handover_record_id"]),
        "supervisorLabel": "",
        "createdAt": _normalize_text(row["created_at"]),
        "updatedAt": _normalize_text(row["updated_at"]),
        "completedAt": _normalize_text(row["completed_at"]),
        "rejectReason": _normalize_text(row["reject_reason"]),
        "rejectedByUserId": rejected_by["username"],
        "rejectedBy": rejected_by["label"],
        "rejectedAt": _normalize_text(row["rejected_at"]),
        "reviewSubmission": review_submission,
        "reviewStatusLabel": review_submission.get("statusLabel", "") if review_submission else "",
        "reviewAverageScore": review_submission.get("averageScore") if review_submission else None,
        "reviewGrade": review_submission.get("grade", "") if review_submission else "",
        "attachments": attachments_by_owner.get(int(row["id"]), []),
    }


def _build_latest_task_submission_lookup():
    lookup = {}
    for row in task_repository.fetch_all_task_submissions():
        task_id = int(row["task_id"])
        if task_id not in lookup:
            lookup[task_id] = row
    return lookup


def _build_task_review_lookup() -> dict[int, list[Any]]:
    lookup: dict[int, list[Any]] = {}
    for row in task_repository.fetch_all_task_reviews():
        lookup.setdefault(int(row["submission_id"]), []).append(row)
    return lookup


def _build_task_submission_summary(
    submission_row,
    task_row,
    reviews_by_submission: dict[int, list[Any]],
    submission_attachments_by_owner: dict[int, list[dict[str, Any]]],
) -> dict[str, Any] | None:
    if not submission_row:
        return None

    submission_id = int(submission_row["id"])
    review_rows = reviews_by_submission.get(submission_id, [])
    review_map = {
        _normalize_text(row["reviewer_user"]): row
        for row in review_rows
    }
    reviewers = []
    for reviewer in _build_task_reviewers_from_row(task_row):
        reviewer_row = review_map.get(reviewer["username"])
        reviewers.append(
            {
                "username": reviewer["username"],
                "label": reviewer["label"],
                "score": float(reviewer_row["score"]) if reviewer_row else None,
                "comment": _normalize_text(reviewer_row["comment"]) if reviewer_row else "",
                "reviewedAt": _normalize_text(reviewer_row["reviewed_at"]) if reviewer_row else "",
                "hasReviewed": bool(reviewer_row),
            }
        )

    status = _normalize_text(submission_row["status"]) or "pending"
    average_score = submission_row["average_score"]
    return {
        "id": submission_id,
        "taskId": int(submission_row["task_id"]),
        "submitterUserId": _build_person_reference(submission_row["submitter_user"])["username"],
        "submitterUser": _build_person_reference(submission_row["submitter_user"])["label"],
        "content": _normalize_text(submission_row["content"]),
        "status": status,
        "statusLabel": _get_submission_status_label(status),
        "averageScore": round(float(average_score), 2) if average_score is not None else None,
        "grade": _normalize_text(submission_row["grade"]),
        "submittedAt": _normalize_text(submission_row["submitted_at"]),
        "reviewedAt": _normalize_text(submission_row["reviewed_at"]),
        "updatedAt": _normalize_text(submission_row["updated_at"]),
        "reviewers": reviewers,
        "reviewerLabels": "、".join(item["label"] for item in reviewers if item.get("label")),
        "attachments": submission_attachments_by_owner.get(submission_id, []),
    }


def _build_task_reviewers_from_row(task_row) -> list[dict[str, str]]:
    raw_values = [_normalize_text(task_row["creator_user"])]
    raw_values.extend(_parse_mention_users(task_row["mention_users"]))
    reviewers: list[dict[str, str]] = []
    seen_usernames: set[str] = set()
    for value in raw_values:
        username = _resolve_person_username(value)
        if not username or username in seen_usernames:
            continue
        if not user_repository.fetch_user(username):
            continue
        reference = _build_person_reference(username)
        seen_usernames.add(username)
        reviewers.append(reference)
    return reviewers


def _get_submission_status_label(status: str) -> str:
    normalized_status = _normalize_text(status)
    if normalized_status == "passed":
        return "审核通过"
    if normalized_status == "failed":
        return "审核未通过"
    return "待审核"


def _get_review_grade(average_score: float) -> str:
    if average_score > 80:
        return "优秀"
    if average_score >= 60:
        return "良"
    return "不合格"


def _normalize_score(value) -> float:
    try:
        score = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("评分必须是 0-100 的数字") from exc
    if score < 0 or score > 100:
        raise ValueError("评分必须在 0-100 之间")
    return score


def _normalize_text(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _parse_mention_users(value) -> list[str]:
    if isinstance(value, list):
        raw_items = value
    else:
        text_value = _normalize_text(value)
        if not text_value:
            return []
        try:
            parsed_value = json.loads(text_value)
            raw_items = parsed_value if isinstance(parsed_value, list) else []
        except json.JSONDecodeError:
            raw_items = text_value.split(",")

    mention_users: list[str] = []
    seen_values: set[str] = set()
    for item in raw_items:
        normalized_item = _normalize_text(item)
        if not normalized_item or normalized_item in seen_values:
            continue
        seen_values.add(normalized_item)
        mention_users.append(normalized_item)
    return mention_users


def _serialize_mention_users(value) -> str:
    return json.dumps(_parse_mention_users(value), ensure_ascii=False)


def _format_mention_user_labels(values) -> str:
    labels: list[str] = []
    for value in _parse_mention_users(values):
        user_row = user_repository.fetch_user(value)
        if not user_row:
            for row in user_repository.fetch_all_users():
                display_name = _normalize_text(row["display_name"])
                username = _normalize_text(row["user"])
                if value in {display_name, username}:
                    user_row = row
                    break
        if user_row:
            labels.append(_normalize_text(user_row["display_name"]) or _normalize_text(user_row["user"]))
        else:
            labels.append(value)
    return "、".join(labels)


def _find_user_row_by_identity(value):
    normalized_value = _normalize_text(value)
    if not normalized_value:
        return None
    user_row = user_repository.fetch_user(normalized_value)
    if user_row:
        return user_row
    for row in user_repository.fetch_all_users():
        username = _normalize_text(row["user"])
        display_name = _normalize_text(row["display_name"])
        if normalized_value in {username, display_name}:
            return row
    return None


def _resolve_person_username(value) -> str:
    normalized_value = _normalize_text(value)
    if not normalized_value:
        return ""
    user_row = _find_user_row_by_identity(normalized_value)
    if user_row:
        return _normalize_text(user_row["user"])
    return normalized_value


def _build_person_reference(value) -> dict[str, str]:
    normalized_value = _normalize_text(value)
    if not normalized_value:
        return {"username": "", "label": ""}
    user_row = _find_user_row_by_identity(normalized_value)
    if user_row:
        username = _normalize_text(user_row["user"])
        label = _normalize_text(user_row["display_name"]) or username
        return {"username": username, "label": label}
    return {"username": normalized_value, "label": normalized_value}


def _matches_person_filter(identity_value, filter_value) -> bool:
    normalized_filter = _normalize_text(filter_value)
    if not normalized_filter:
        return True

    identity_reference = _build_person_reference(identity_value)
    filter_reference = _build_person_reference(normalized_filter)
    identity_values = {
        _normalize_text(identity_value),
        identity_reference["username"],
        identity_reference["label"],
    }
    filter_values = {
        normalized_filter,
        filter_reference["username"],
        filter_reference["label"],
    }
    identity_values.discard("")
    filter_values.discard("")
    return bool(identity_values & filter_values)


def _migrate_person_fields_to_usernames() -> None:
    for row in task_repository.fetch_all_handover_records():
        payload: dict[str, str] = {}
        handover_username = _resolve_person_username(row["handover_user"])
        receiver_username = _resolve_person_username(row["receiver_user"])
        created_by_username = _resolve_person_username(row["created_by"])
        if handover_username and handover_username != _normalize_text(row["handover_user"]) and user_repository.fetch_user(handover_username):
            payload["handover_user"] = handover_username
        if receiver_username and receiver_username != _normalize_text(row["receiver_user"]) and user_repository.fetch_user(receiver_username):
            payload["receiver_user"] = receiver_username
        if created_by_username and created_by_username != _normalize_text(row["created_by"]) and user_repository.fetch_user(created_by_username):
            payload["created_by"] = created_by_username
        if payload:
            task_repository.update_handover_record(int(row["id"]), payload)

    for row in task_repository.fetch_all_tasks():
        payload: dict[str, str] = {}
        assignee_username = _resolve_person_username(row["assignee_user"])
        creator_username = _resolve_person_username(row["creator_user"])
        rejected_by_username = _resolve_person_username(row["rejected_by"])
        if assignee_username and assignee_username != _normalize_text(row["assignee_user"]) and user_repository.fetch_user(assignee_username):
            payload["assignee_user"] = assignee_username
        if creator_username and creator_username != _normalize_text(row["creator_user"]) and user_repository.fetch_user(creator_username):
            payload["creator_user"] = creator_username
        if rejected_by_username and rejected_by_username != _normalize_text(row["rejected_by"]) and user_repository.fetch_user(rejected_by_username):
            payload["rejected_by"] = rejected_by_username
        if payload:
            task_repository.update_task(int(row["id"]), payload)


def _actor_has_level5(actor_username: str) -> bool:
    try:
        actor_profile = get_user_summary(actor_username)
    except KeyError:
        return False
    return int(actor_profile.get("permissionLevel") or 1) >= 5


def _actor_is_super_admin(actor_username: str) -> bool:
    try:
        actor_profile = get_user_summary(actor_username)
    except KeyError:
        return False
    return _normalize_role(actor_profile.get("role")) == "admin"


def _is_actor_task_assignee(task_row, actor_username: str) -> bool:
    return _is_user_related_to_values(
        _get_user_identity_values(actor_username),
        task_row["assignee_user"],
    )


def _can_actor_edit_task(task_row, actor_username: str) -> bool:
    if _actor_has_level5(actor_username):
        return True

    actor_values = _get_user_identity_values(actor_username)
    creator_user = _normalize_text(task_row["creator_user"])
    if _is_user_related_to_values(actor_values, creator_user):
        return True

    creator_row = _find_user_row_by_identity(creator_user)
    if not creator_row:
        return False
    return _normalize_text(creator_row["supervisor_user"]) == _normalize_text(actor_username)


def _normalize_role(value) -> str:
    role = _normalize_text(value).lower()
    role = ROLE_ALIASES.get(role, role)
    return role if role in ROLE_PERMISSION_LEVELS else "user"


def _resolve_person_name(value) -> str:
    normalized_value = _normalize_text(value)
    if not normalized_value:
        return ""
    user_row = user_repository.fetch_user(normalized_value)
    if user_row:
        return _normalize_text(user_row["display_name"]) or _normalize_text(user_row["user"])
    for row in user_repository.fetch_all_users():
        display_name = _normalize_text(row["display_name"])
        if display_name == normalized_value:
            return display_name or _normalize_text(row["user"])
    return normalized_value


def _get_supervisor_for_person(value) -> dict[str, str]:
    normalized_value = _normalize_text(value)
    if not normalized_value:
        return {"username": "", "label": ""}

    user_row = user_repository.fetch_user(normalized_value)
    if not user_row:
        for row in user_repository.fetch_all_users():
            display_name = _normalize_text(row["display_name"])
            username = _normalize_text(row["user"])
            if display_name == normalized_value or username == normalized_value:
                user_row = row
                break
    if not user_row:
        return {"username": "", "label": ""}

    supervisor_user = _normalize_text(user_row["supervisor_user"])
    if not supervisor_user:
        return {"username": "", "label": ""}

    supervisor_row = user_repository.fetch_user(supervisor_user)
    supervisor_label = ""
    if supervisor_row:
        supervisor_label = _normalize_text(supervisor_row["display_name"]) or _normalize_text(supervisor_row["user"])
    return {"username": supervisor_user, "label": supervisor_label or supervisor_user}


def _get_user_identity_values(username: str | None) -> set[str]:
    normalized_username = _normalize_text(username)
    if not normalized_username:
        return set()

    values = {normalized_username}
    user_row = user_repository.fetch_user(normalized_username)
    if not user_row:
        return values

    display_name = _normalize_text(user_row["display_name"])
    if display_name:
        values.add(display_name)
    return values


def _is_user_related_to_values(user_values: set[str], value) -> bool:
    normalized_value = _normalize_text(value)
    if not user_values or not normalized_value:
        return False
    if normalized_value in user_values:
        return True

    user_row = user_repository.fetch_user(normalized_value)
    if user_row:
        return _normalize_text(user_row["user"]) in user_values or _normalize_text(user_row["display_name"]) in user_values

    for row in user_repository.fetch_all_users():
        username = _normalize_text(row["user"])
        display_name = _normalize_text(row["display_name"])
        if normalized_value in {username, display_name}:
            return username in user_values or display_name in user_values
    return False


def _is_user_related_to_any(user_values: set[str], values) -> bool:
    return any(
        _is_user_related_to_values(user_values, value)
        for value in _parse_mention_users(values)
    )


def _is_user_mentioned(user_values: set[str], *texts) -> bool:
    if not user_values:
        return False
    normalized_text = "\n".join(_normalize_text(text) for text in texts if _normalize_text(text))
    if not normalized_text:
        return False
    return any(f"@{value}" in normalized_text for value in user_values if value)


def _format_remaining_text(minutes_until: int) -> str:
    if int(minutes_until or 0) < 0:
        return "已到期"
    safe_minutes = max(0, int(minutes_until or 0))
    total_hours = (safe_minutes + 59) // 60 if safe_minutes else 0
    days = total_hours // 24
    hours = total_hours % 24
    return f"{days}天{hours:02d}小时"


def _get_next_shift(shift_group_id: int | None, shifts: list[dict[str, Any]]) -> dict[str, Any]:
    if not shift_group_id or not shifts:
        return {}

    sorted_shifts = sorted(
        shifts,
        key=lambda item: (
            _safe_int(item.get("sortOrder")) or 0,
            _safe_int(item.get("id")) or 0,
        ),
    )
    current_index = next(
        (index for index, item in enumerate(sorted_shifts) if item["id"] == shift_group_id),
        None,
    )
    if current_index is None:
        return {}
    return sorted_shifts[(current_index + 1) % len(sorted_shifts)]


def _safe_int(value) -> int | None:
    if value in (None, "", "null"):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _normalize_time_text(value) -> str:
    text = _normalize_text(value)
    if not text:
        return ""
    if len(text) == 5:
        return text
    try:
        parsed = datetime.fromisoformat(text)
        return parsed.strftime("%H:%M")
    except ValueError:
        return text[:5]


def _normalize_datetime_text(value) -> str:
    text = _normalize_text(value)
    if not text:
        return ""
    normalized = text.replace("T", " ")
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(normalized, fmt).isoformat(timespec="minutes")
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(text).isoformat(timespec="minutes")
    except ValueError:
        return text


def _parse_setting_value(raw_value: str, default_value):
    if isinstance(default_value, bool):
        return str(raw_value).lower() in {"1", "true", "yes"}
    if isinstance(default_value, int):
        try:
            return int(raw_value)
        except (TypeError, ValueError):
            return default_value
    try:
        return json.loads(raw_value)
    except (TypeError, json.JSONDecodeError):
        return raw_value


def _parse_datetime(value: str) -> datetime:
    normalized = _normalize_text(value)
    if not normalized:
        return datetime.min
    return datetime.fromisoformat(normalized.replace(" ", "T"))


def _get_next_shift_datetime(start_time_text: str, reference: datetime) -> datetime:
    hours, minutes = [int(item) for item in start_time_text.split(":")]
    candidate = datetime.combine(reference.date(), time(hours, minutes))
    if candidate < reference:
        candidate += timedelta(days=1)
    return candidate


def _now_text() -> str:
    return datetime.now().isoformat(timespec="minutes")
