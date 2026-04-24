from __future__ import annotations

from io import BytesIO

from fab_app.services.task_system_service import list_handover_records, list_tasks


def export_task_data(export_type: str, export_format: str, filters: dict) -> tuple[BytesIO, str, str]:
    normalized_type = str(export_type or "handover").strip().lower()
    normalized_format = str(export_format or "excel").strip().lower()
    if normalized_type not in {"handover", "task"}:
        raise ValueError("导出类型无效")
    if normalized_format != "excel":
        raise ValueError("仅支持 Excel 导出")

    rows = list_handover_records(filters) if normalized_type == "handover" else list_tasks(filters)
    return _export_excel(normalized_type, rows)


def _export_excel(export_type: str, rows: list[dict]) -> tuple[BytesIO, str, str]:
    from openpyxl import Workbook

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Data"

    if export_type == "handover":
        headers = [
            ("title", "标题"),
            ("shiftName", "班次"),
            ("recordTime", "记录时间"),
            ("handoverUser", "交班人"),
            ("receiverUser", "接班人"),
            ("workSummary", "当班情况"),
            ("precautions", "注意事项"),
            ("pendingItems", "未完成事项"),
            ("keywords", "关键词"),
        ]
    else:
        headers = [
            ("title", "任务标题"),
            ("status", "状态"),
            ("priority", "优先级"),
            ("assigneeUser", "负责人"),
            ("creatorUser", "创建人"),
            ("dueAt", "到期时间"),
            ("handoverRecordId", "关联交接记录"),
            ("description", "任务说明"),
        ]

    sheet.append([header for _, header in headers])
    for row in rows:
        sheet.append([row.get(key, "") for key, _ in headers])

    buffer = BytesIO()
    workbook.save(buffer)
    buffer.seek(0)
    return (
        buffer,
        f"{export_type}_records.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
