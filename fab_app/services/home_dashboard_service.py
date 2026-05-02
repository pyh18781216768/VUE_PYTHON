from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta
from typing import Any

from fab_app.services.dashboard_service import get_dashboard_data
from fab_app.services.task_system_service import list_tasks


PARAMETER_PAGES = ("oc", "angle", "lens")
TASK_STATUS_ORDER = ("未开始", "进行中", "待审核", "已完成", "已驳回")


def get_home_dashboard_data(refresh: bool = False) -> dict[str, Any]:
    parameter_summaries = {
        page: _load_parameter_summary(page, refresh=refresh)
        for page in PARAMETER_PAGES
    }
    tasks = list_tasks({})
    task_summary = _build_task_summary(tasks)
    return {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "parameters": parameter_summaries,
        "tasks": task_summary,
        "notices": _build_notices(parameter_summaries, tasks),
    }


def _load_parameter_summary(page: str, refresh: bool = False) -> dict[str, Any]:
    try:
        dashboard = get_dashboard_data(page=page, refresh=refresh)
    except Exception as exc:
        return _empty_parameter_summary(page, str(exc))

    records = dashboard.get("records") or []
    latest_date = dashboard.get("latestAvailableDate") or ""
    latest_rows = [
        {**record, "point": point}
        for record in records
        for point in [_resolve_point(record.get("values") or [], latest_date)]
        if point
    ]
    status_counts = _count_parameter_statuses(latest_rows, dashboard.get("thresholds") or {})
    latest_count = len(latest_rows)
    stable_rate = _safe_percent(status_counts["normal"], latest_count)
    trend = _build_parameter_trend(records, dashboard)
    top_items = _build_top_parameter_items(latest_rows, dashboard.get("thresholds") or {})

    return {
        "page": page,
        "title": dashboard.get("title") or page.upper(),
        "latestDate": latest_date,
        "recordCount": int(dashboard.get("recordCount") or 0),
        "pointCount": int(dashboard.get("pointCount") or 0),
        "databaseRowCount": int(dashboard.get("databaseRowCount") or 0),
        "latestCount": latest_count,
        "normalCount": status_counts["normal"],
        "warningCount": status_counts["warning"],
        "dangerCount": status_counts["danger"],
        "stableRate": stable_rate,
        "averageSeverity": _average_severity(latest_rows),
        "totalInput": _sum_point_field(latest_rows, "inputCount"),
        "trend": trend,
        "topItems": top_items,
        "error": "",
    }


def _empty_parameter_summary(page: str, error: str = "") -> dict[str, Any]:
    return {
        "page": page,
        "title": page.upper(),
        "latestDate": "",
        "recordCount": 0,
        "pointCount": 0,
        "databaseRowCount": 0,
        "latestCount": 0,
        "normalCount": 0,
        "warningCount": 0,
        "dangerCount": 0,
        "stableRate": 0,
        "averageSeverity": None,
        "totalInput": 0,
        "trend": [],
        "topItems": [],
        "error": error,
    }


def _build_task_summary(tasks: list[dict[str, Any]]) -> dict[str, Any]:
    status_counts = Counter(_normalize_text(task.get("status")) or "未开始" for task in tasks)
    status_names = _ordered_task_statuses(status_counts)
    total = len(tasks)
    completed = status_counts.get("已完成", 0)
    active = status_counts.get("进行中", 0) + status_counts.get("未开始", 0)
    pending_review = status_counts.get("待审核", 0)
    rejected = status_counts.get("已驳回", 0)
    scores = [
        float(task.get("reviewAverageScore"))
        for task in tasks
        if task.get("reviewAverageScore") not in (None, "")
    ]
    status_items = [{"name": status, "value": int(status_counts.get(status, 0))} for status in status_names]

    return {
        "total": total,
        "completed": completed,
        "active": active,
        "pendingReview": pending_review,
        "rejected": rejected,
        "completionRate": _safe_percent(completed, total),
        "averageScore": round(sum(scores) / len(scores), 2) if scores else None,
        "statusItems": status_items,
        "progress": _build_task_progress(tasks, status_names),
    }


def _build_parameter_trend(records: list[dict[str, Any]], dashboard: dict[str, Any]) -> list[dict[str, Any]]:
    date_labels = ((dashboard.get("dimensions") or {}).get("dateLabels") or [])[-7:]
    thresholds = dashboard.get("thresholds") or {}
    trend = []
    for date in date_labels:
        rows = [
            {"point": point}
            for record in records
            for point in record.get("values") or []
            if _normalize_text(point.get("date")) == _normalize_text(date)
        ]
        counts = _count_parameter_statuses(rows, thresholds)
        trend.append(
            {
                "date": date,
                "stableRate": _safe_percent(counts["normal"], len(rows)),
                "averageSeverity": _average_severity(rows),
                "inputCount": _sum_point_field(rows, "inputCount"),
            }
        )
    return trend


def _build_task_progress(tasks: list[dict[str, Any]], status_names: list[str]) -> list[dict[str, Any]]:
    today = datetime.now().date()
    dates = [(today - timedelta(days=offset)).isoformat() for offset in range(6, -1, -1)]
    buckets = {
        date: {
            "date": date,
            "completed": 0,
            "active": 0,
            "pendingReview": 0,
            "statusCounts": {status: 0 for status in status_names},
        }
        for date in dates
    }
    for task in tasks:
        bucket_date = _task_bucket_date(task)
        if bucket_date not in buckets:
            continue
        status = _normalize_text(task.get("status")) or "未开始"
        if status not in buckets[bucket_date]["statusCounts"]:
            buckets[bucket_date]["statusCounts"][status] = 0
        buckets[bucket_date]["statusCounts"][status] += 1
        if status == "已完成":
            buckets[bucket_date]["completed"] += 1
        elif status == "待审核":
            buckets[bucket_date]["pendingReview"] += 1
        else:
            buckets[bucket_date]["active"] += 1
    return [buckets[date] for date in dates]


def _ordered_task_statuses(status_counts: Counter) -> list[str]:
    known_statuses = [status for status in TASK_STATUS_ORDER if status_counts.get(status, 0) > 0]
    extra_statuses = sorted(
        status for status, count in status_counts.items()
        if count > 0 and status not in TASK_STATUS_ORDER
    )
    return known_statuses + extra_statuses


def _build_top_parameter_items(
    latest_rows: list[dict[str, Any]],
    thresholds: dict[str, Any],
) -> list[dict[str, Any]]:
    items = []
    for row in latest_rows:
        point = row.get("point") or {}
        severity = _safe_float(point.get("severityValue"))
        items.append(
            {
                "name": _normalize_text(row.get("recordLabel")) or _normalize_text(row.get("category")) or "--",
                "category": _normalize_text(row.get("category")) or "--",
                "value": severity,
                "displayValue": _format_metric(severity),
                "status": _parameter_status_label(severity, thresholds),
                "tone": _parameter_status_tone(severity, thresholds),
            }
        )
    return sorted(
        items,
        key=lambda item: item["value"] if item["value"] is not None else -1,
        reverse=True,
    )[:5]


def _build_notices(
    parameter_summaries: dict[str, dict[str, Any]],
    tasks: list[dict[str, Any]],
) -> list[dict[str, str]]:
    notices: list[dict[str, str]] = []
    now = datetime.now()

    for task in sorted(tasks, key=lambda item: _parse_datetime(item.get("dueAt")) or datetime.max):
        status = _normalize_text(task.get("status"))
        if status == "已完成":
            continue
        due_at = _parse_datetime(task.get("dueAt"))
        if due_at and due_at < now:
            notices.append(
                _notice(
                    "任務到期",
                    "danger",
                    f"{_normalize_text(task.get('title')) or '未命名任務'} 已超過到期時間，負責人：{_normalize_text(task.get('assigneeUser')) or '--'}",
                    task.get("dueAt"),
                )
            )
        elif status == "待审核":
            notices.append(
                _notice(
                    "任務審核",
                    "warn",
                    f"{_normalize_text(task.get('title')) or '未命名任務'} 等待審核評分。",
                    task.get("updatedAt"),
                )
            )
        if len(notices) >= 3:
            break

    for page, summary in parameter_summaries.items():
        risky_items = [
            item for item in summary.get("topItems", [])
            if item.get("tone") in {"danger", "warn"}
        ]
        if not risky_items:
            continue
        item = risky_items[0]
        notices.append(
            _notice(
                _page_notice_tag(page),
                item.get("tone") or "warn",
                f"{item.get('name') or '--'} 目前風險值 {item.get('displayValue') or '--'}，請關注。",
                summary.get("latestDate"),
            )
        )
        if len(notices) >= 3:
            break

    if not notices:
        notices.append(_notice("系統狀態", "good", "目前首頁資料已連接資料庫，暫無高風險提醒。", now.isoformat(timespec="seconds")))
    return notices[:3]


def _count_parameter_statuses(rows: list[dict[str, Any]], thresholds: dict[str, Any]) -> Counter:
    counts = Counter({"normal": 0, "warning": 0, "danger": 0})
    for row in rows:
        tone = _parameter_status_tone(_safe_float((row.get("point") or {}).get("severityValue")), thresholds)
        if tone == "danger":
            counts["danger"] += 1
        elif tone == "warn":
            counts["warning"] += 1
        else:
            counts["normal"] += 1
    return counts


def _parameter_status_tone(value: float | None, thresholds: dict[str, Any]) -> str:
    if value is None:
        return "low"
    yellow = _safe_float(thresholds.get("yellow"))
    red = _safe_float(thresholds.get("red"))
    if red is not None and value >= red:
        return "danger"
    if yellow is not None and value >= yellow:
        return "warn"
    return "good"


def _parameter_status_label(value: float | None, thresholds: dict[str, Any]) -> str:
    tone = _parameter_status_tone(value, thresholds)
    if tone == "danger":
        return "異常"
    if tone == "warn":
        return "預警"
    if tone == "low":
        return "無資料"
    return "正常"


def _resolve_point(values: list[dict[str, Any]], snapshot_date: str):
    if not values:
        return None
    normalized_snapshot = _normalize_text(snapshot_date)
    if not normalized_snapshot:
        return values[-1]
    for point in reversed(values):
        if _normalize_text(point.get("date")) == normalized_snapshot:
            return point
    return values[-1]


def _average_severity(rows: list[dict[str, Any]]) -> float | None:
    weighted_total = 0.0
    input_total = 0.0
    value_total = 0.0
    value_count = 0
    for row in rows:
        point = row.get("point") or {}
        severity = _safe_float(point.get("severityValue"))
        if severity is None:
            continue
        input_count = _safe_float(point.get("inputCount")) or 0
        weighted_total += severity * input_count
        input_total += input_count
        value_total += severity
        value_count += 1
    if input_total:
        return round(weighted_total / input_total, 6)
    if value_count:
        return round(value_total / value_count, 6)
    return None


def _sum_point_field(rows: list[dict[str, Any]], field_name: str) -> int:
    return int(sum(_safe_float((row.get("point") or {}).get(field_name)) or 0 for row in rows))


def _task_bucket_date(task: dict[str, Any]) -> str:
    for key in ("updatedAt", "createdAt", "dueAt", "startAt"):
        parsed = _parse_datetime(task.get(key))
        if parsed:
            return parsed.date().isoformat()
    return ""


def _notice(tag: str, level: str, title: str, time_value) -> dict[str, str]:
    return {
        "tag": tag,
        "level": level,
        "title": title,
        "time": _format_notice_time(time_value),
    }


def _page_notice_tag(page: str) -> str:
    if page == "oc":
        return "OC 預警"
    if page == "angle":
        return "Angle 預警"
    return "Lens 預警"


def _format_notice_time(value) -> str:
    parsed = _parse_datetime(value)
    if parsed:
        return parsed.strftime("%Y-%m-%d %H:%M:%S")
    text = _normalize_text(value)
    return text or "--"


def _format_metric(value: float | None) -> str:
    if value is None:
        return "--"
    return f"{value:.3f}"


def _safe_percent(numerator: int | float, denominator: int | float) -> float:
    if not denominator:
        return 0.0
    return round(float(numerator) / float(denominator) * 100, 2)


def _safe_float(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_datetime(value) -> datetime | None:
    text = _normalize_text(value)
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace(" ", "T"))
    except ValueError:
        try:
            return datetime.fromisoformat(f"{text}T00:00:00")
        except ValueError:
            return None


def _normalize_text(value) -> str:
    if value is None:
        return ""
    return str(value).strip()
