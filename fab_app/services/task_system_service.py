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

TASK_STATUSES = ("未开始", "进行中", "已完成")
TASK_PRIORITIES = ("低", "中", "高")
UPLOAD_ROOT = BASE_DIR / "storage" / "uploads"


def ensure_task_system_store() -> None:
    task_repository.ensure_task_tables()
    _seed_shift_groups()
    _seed_settings()


def get_task_system_payload(username: str) -> dict[str, Any]:
    user_profile = get_user_summary(username)
    return {
        "currentUser": user_profile,
        "users": list_users(),
        "shifts": list_shift_groups(),
        "settings": get_system_settings(),
        "handovers": list_handover_records({}),
        "tasks": list_tasks({}),
        "reports": get_report_summary(),
        "reminders": get_reminders(),
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
        raise ValueError("用户名不能为空")

    existing = user_repository.fetch_user(username)
    role = _normalize_role(payload.get("role"))
    user_payload = {
        "display_name": _normalize_text(payload.get("displayName")),
        "department": _normalize_text(payload.get("department")),
        "email": _normalize_text(payload.get("email")),
        "phone": _normalize_text(payload.get("phone")),
        "role": role,
        "is_active": 1 if payload.get("isActive", True) else 0,
        "shift_group_id": _safe_int(payload.get("shiftGroupId")),
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
                "role": role,
                "is_active": user_payload["is_active"],
                "shift_group_id": user_payload["shift_group_id"],
                "created_at": now,
                "updated_at": now,
            }
        )

    return get_user_summary(username)


def list_shift_groups() -> list[dict[str, Any]]:
    return [_build_shift_summary(row) for row in task_repository.fetch_all_shift_groups()]


def save_shift_group(payload: dict[str, Any]) -> dict[str, Any]:
    now = _now_text()
    shift_payload = {
        "name": _normalize_text(payload.get("name")),
        "start_time": _normalize_time_text(payload.get("startTime")),
        "end_time": _normalize_time_text(payload.get("endTime")),
        "sort_order": _safe_int(payload.get("sortOrder")) or 0,
        "is_active": 1 if payload.get("isActive", True) else 0,
        "updated_at": now,
    }
    if not shift_payload["name"]:
        raise ValueError("班次名称不能为空")
    if not shift_payload["start_time"] or not shift_payload["end_time"]:
        raise ValueError("班次时间不能为空")

    shift_group_id = _safe_int(payload.get("id"))
    if shift_group_id:
        task_repository.update_shift_group(shift_group_id, shift_payload)
    else:
        shift_group_id = task_repository.insert_shift_group(
            {**shift_payload, "created_at": now}
        )
    return next(
        item for item in list_shift_groups() if item["id"] == shift_group_id
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


def save_system_settings(payload: dict[str, Any], actor_username: str) -> dict[str, Any]:
    now = _now_text()
    current_settings = get_system_settings()
    for key in DEFAULT_SETTINGS:
        value = payload.get(key, current_settings[key])
        task_repository.upsert_setting(key, value, now, actor_username)
    return get_system_settings()


def list_handover_records(filters: dict[str, Any]) -> list[dict[str, Any]]:
    shifts_by_id = {item["id"]: item for item in list_shift_groups()}
    attachments_by_owner = _build_attachment_lookup("handover")
    records = []
    keyword = _normalize_text(filters.get("keyword")).lower()
    date_from = _normalize_text(filters.get("dateFrom"))
    date_to = _normalize_text(filters.get("dateTo"))
    shift_group_id = _safe_int(filters.get("shiftGroupId"))
    handover_user = _normalize_text(filters.get("handoverUser"))
    receiver_user = _normalize_text(filters.get("receiverUser"))

    for row in task_repository.fetch_all_handover_records():
        record = _build_handover_summary(row, shifts_by_id, attachments_by_owner)
        if date_from and record["recordTime"][:10] < date_from:
            continue
        if date_to and record["recordTime"][:10] > date_to:
            continue
        if shift_group_id and record["shiftGroupId"] != shift_group_id:
            continue
        if handover_user and record["handoverUser"] != handover_user:
            continue
        if receiver_user and record["receiverUser"] != receiver_user:
            continue
        if keyword:
            haystack = " ".join(
                [
                    record["title"],
                    record["shiftName"],
                    record["handoverUser"],
                    record["receiverUser"],
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
    actor_profile = get_user_summary(actor_username)
    record_payload = {
        "title": _normalize_text(payload.get("title")) or "交接班记录",
        "shift_group_id": _safe_int(payload.get("shiftGroupId")),
        "record_time": _normalize_datetime_text(payload.get("recordTime")) or now,
        "handover_user": _resolve_person_name(payload.get("handoverUser")) or actor_profile["displayLabel"],
        "receiver_user": _resolve_person_name(payload.get("receiverUser")),
        "work_summary": _normalize_text(payload.get("workSummary")),
        "precautions": _normalize_text(payload.get("precautions")),
        "pending_items": _normalize_text(payload.get("pendingItems")),
        "keywords": _normalize_text(payload.get("keywords")),
        "updated_at": now,
    }
    if not record_payload["receiver_user"]:
        raise ValueError("接班人不能为空")

    record_id = _safe_int(payload.get("id"))
    if record_id:
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
                "created_by": actor_username,
                "created_at": now,
            }
        )

    _store_attachments(files, "handover", record_id, actor_username)
    return next(item for item in list_handover_records({}) if item["id"] == record_id)


def list_tasks(filters: dict[str, Any]) -> list[dict[str, Any]]:
    attachments_by_owner = _build_attachment_lookup("task")
    keyword = _normalize_text(filters.get("keyword")).lower()
    status = _normalize_text(filters.get("status"))
    assignee_user = _normalize_text(filters.get("assigneeUser"))
    handover_record_id = _safe_int(filters.get("handoverRecordId"))
    tasks = []

    for row in task_repository.fetch_all_tasks():
        task = _build_task_summary(row, attachments_by_owner)
        if status and task["status"] != status:
            continue
        if assignee_user and task["assigneeUser"] != assignee_user:
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

    due_at = _normalize_datetime_text(payload.get("dueAt"))
    task_payload = {
        "title": _normalize_text(payload.get("title")),
        "description": _normalize_text(payload.get("description")),
        "status": status,
        "priority": priority,
        "due_at": due_at,
        "assignee_user": _resolve_person_name(payload.get("assigneeUser")),
        "handover_record_id": _safe_int(payload.get("handoverRecordId")),
        "reminder_at": _normalize_datetime_text(payload.get("reminderAt")),
        "updated_at": now,
        "completed_at": now if status == "已完成" else None,
    }
    if not task_payload["title"]:
        raise ValueError("任务标题不能为空")

    task_id = _safe_int(payload.get("id"))
    if task_id:
        existing = task_repository.fetch_task(task_id)
        if not existing:
            raise KeyError(task_id)
        if status == "已完成" and not existing["completed_at"]:
            task_payload["completed_at"] = now
        elif status != "已完成":
            task_payload["completed_at"] = None
        task_repository.update_task(task_id, task_payload)
    else:
        task_id = task_repository.insert_task(
            {
                **task_payload,
                "creator_user": actor_username,
                "created_at": now,
            }
        )

    _store_attachments(files, "task", task_id, actor_username)
    return next(item for item in list_tasks({}) if item["id"] == task_id)


def get_report_summary() -> dict[str, Any]:
    handovers = list_handover_records({})
    tasks = list_tasks({})
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
        "openTaskCount": tasks_by_status.get("未开始", 0) + tasks_by_status.get("进行中", 0),
        "tasksByStatus": tasks_by_status,
        "handoversByShift": handovers_by_shift,
    }


def get_reminders() -> dict[str, Any]:
    settings = get_system_settings()
    now = datetime.now()
    task_due_hours = int(settings["notifications.task_due_hours"])
    handover_minutes = int(settings["notifications.handover_minutes"])
    due_before = now + timedelta(hours=task_due_hours)

    due_tasks = [
        task
        for task in list_tasks({})
        if task["status"] != "已完成"
        and task["dueAt"]
        and now <= _parse_datetime(task["dueAt"]) <= due_before
    ]

    shift_reminders = []
    for shift in list_shift_groups():
        if not shift["isActive"]:
            continue
        next_start = _get_next_shift_datetime(shift["startTime"], now)
        minutes_until = int((next_start - now).total_seconds() // 60)
        if 0 <= minutes_until <= handover_minutes:
            shift_reminders.append(
                {
                    "shiftName": shift["name"],
                    "startTime": next_start.isoformat(timespec="minutes"),
                    "minutesUntil": minutes_until,
                }
            )

    return {
        "dueTasks": due_tasks[:10],
        "shiftReminders": shift_reminders,
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


def _build_attachment_lookup(owner_type: str) -> dict[int, list[dict[str, Any]]]:
    lookup: dict[int, list[dict[str, Any]]] = {}
    owner_rows = []
    if owner_type == "handover":
        owner_rows = task_repository.fetch_all_handover_records()
    elif owner_type == "task":
        owner_rows = task_repository.fetch_all_tasks()

    for row in owner_rows:
        attachments = [
            {
                "id": item["id"],
                "originalName": item["original_name"],
                "contentType": item["content_type"] or "",
                "uploadedBy": item["uploaded_by"],
                "uploadedAt": item["uploaded_at"],
                "downloadUrl": f"/api/task-system/attachments/{item['id']}",
            }
            for item in task_repository.fetch_attachments_for_owner(owner_type, row["id"])
        ]
        lookup[row["id"]] = attachments
    return lookup


def _build_user_summary(row) -> dict[str, Any]:
    return {
        "id": row["rowid"],
        "username": _normalize_text(row["user"]),
        "displayName": _normalize_text(row["display_name"]),
        "displayLabel": _normalize_text(row["display_name"]) or _normalize_text(row["user"]),
        "department": _normalize_text(row["department"]),
        "email": _normalize_text(row["email"]),
        "phone": _normalize_text(row["phone"]),
        "role": _normalize_role(row["role"]),
        "isActive": bool(row["is_active"] if row["is_active"] is not None else 1),
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


def _build_handover_summary(row, shifts_by_id: dict[int, dict[str, Any]], attachments_by_owner: dict[int, list[dict[str, Any]]]):
    shift_group_id = _safe_int(row["shift_group_id"])
    shift = shifts_by_id.get(shift_group_id, {})
    return {
        "id": int(row["id"]),
        "title": _normalize_text(row["title"]),
        "shiftGroupId": shift_group_id,
        "shiftName": _normalize_text(shift.get("name")) or "--",
        "recordTime": _normalize_text(row["record_time"]),
        "handoverUser": _normalize_text(row["handover_user"]),
        "receiverUser": _normalize_text(row["receiver_user"]),
        "workSummary": _normalize_text(row["work_summary"]),
        "precautions": _normalize_text(row["precautions"]),
        "pendingItems": _normalize_text(row["pending_items"]),
        "keywords": _normalize_text(row["keywords"]),
        "createdBy": _normalize_text(row["created_by"]),
        "createdAt": _normalize_text(row["created_at"]),
        "updatedAt": _normalize_text(row["updated_at"]),
        "attachments": attachments_by_owner.get(int(row["id"]), []),
    }


def _build_task_summary(row, attachments_by_owner: dict[int, list[dict[str, Any]]]):
    return {
        "id": int(row["id"]),
        "title": _normalize_text(row["title"]),
        "description": _normalize_text(row["description"]),
        "status": _normalize_text(row["status"]),
        "priority": _normalize_text(row["priority"]),
        "dueAt": _normalize_text(row["due_at"]),
        "assigneeUser": _normalize_text(row["assignee_user"]),
        "creatorUser": _normalize_text(row["creator_user"]),
        "handoverRecordId": _safe_int(row["handover_record_id"]),
        "reminderAt": _normalize_text(row["reminder_at"]),
        "createdAt": _normalize_text(row["created_at"]),
        "updatedAt": _normalize_text(row["updated_at"]),
        "completedAt": _normalize_text(row["completed_at"]),
        "attachments": attachments_by_owner.get(int(row["id"]), []),
    }


def _normalize_text(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _normalize_role(value) -> str:
    role = _normalize_text(value).lower()
    return "admin" if role == "admin" else "user"


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
