from __future__ import annotations

from io import BytesIO

from fab_app.services.task_system_service import list_handover_records, list_operation_logs, list_tasks


def export_task_data(export_type: str, export_format: str, filters: dict) -> tuple[BytesIO, str, str]:
    normalized_type = str(export_type or "handover").strip().lower()
    normalized_format = str(export_format or "excel").strip().lower()
    if normalized_type in {"operations", "operationlogs", "operation_logs"}:
        normalized_type = "operation"
    if normalized_type not in {"handover", "task", "operation"}:
        raise ValueError("匯出類型無效")
    if normalized_format != "excel":
        raise ValueError("僅支援 Excel 匯出")

    if normalized_type == "handover":
        rows = list_handover_records(filters)
    elif normalized_type == "task":
        rows = list_tasks(filters)
    else:
        rows = list_operation_logs(filters)
    return _export_excel(normalized_type, rows)


def _export_excel(export_type: str, rows: list[dict]) -> tuple[BytesIO, str, str]:
    from openpyxl import Workbook

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Data"

    if export_type == "handover":
        headers = [
            ("title", "標題"),
            ("shiftName", "交班班次"),
            ("receiverShiftName", "接班班次"),
            ("floorName", "樓層"),
            ("recordTime", "記錄時間"),
            ("handoverUser", "交班人"),
            ("receiverUser", "接班人"),
            ("receiverSupervisorLabel", "主管"),
            ("mentionUserLabels", "@人員"),
            ("workSummary", "當班情況"),
            ("precautions", "注意事項"),
            ("pendingItems", "未完成事項"),
            ("keywords", "關鍵詞"),
        ]
    elif export_type == "task":
        headers = [
            ("title", "任務標題"),
            ("status", "狀態"),
            ("priority", "優先級"),
            ("assigneeUser", "負責人"),
            ("creatorUser", "建立人"),
            ("startAt", "開始時間"),
            ("dueAt", "到期時間"),
            ("handoverRecordId", "關聯交接記錄"),
            ("supervisorLabel", "主管"),
            ("mentionUserLabels", "@人員"),
            ("rejectReason", "駁回理由"),
            ("rejectedBy", "駁回人"),
            ("rejectedAt", "駁回時間"),
            ("reviewStatusLabel", "審核狀態"),
            ("reviewAverageScore", "審核均分"),
            ("reviewGrade", "審核等級"),
            ("description", "任務說明"),
        ]
    else:
        headers = [
            ("id", "ID"),
            ("operatorLabel", "操作人"),
            ("operatorUser", "操作人工號"),
            ("operatedAt", "操作時間"),
            ("pageName", "操作頁面"),
            ("actionType", "操作功能"),
            ("recordLabel", "操作了哪條記錄"),
            ("recordId", "記錄ID"),
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
