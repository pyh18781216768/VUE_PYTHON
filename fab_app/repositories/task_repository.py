from __future__ import annotations

import json

from fab_app.core.database import get_connection


def ensure_task_tables() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS SHIFT_GROUP (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TEXT,
                updated_at TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS SYSTEM_SETTING (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TEXT,
                updated_by TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS HANDOVER_RECORD (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                shift_group_id INTEGER,
                record_time TEXT NOT NULL,
                handover_user TEXT NOT NULL,
                receiver_user TEXT NOT NULL,
                work_summary TEXT,
                precautions TEXT,
                pending_items TEXT,
                keywords TEXT,
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS TASK_ITEM (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL,
                priority TEXT NOT NULL,
                due_at TEXT,
                assignee_user TEXT,
                creator_user TEXT NOT NULL,
                handover_record_id INTEGER,
                reminder_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                completed_at TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS ATTACHMENT (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_type TEXT NOT NULL,
                owner_id INTEGER NOT NULL,
                original_name TEXT NOT NULL,
                stored_name TEXT NOT NULL,
                stored_path TEXT NOT NULL,
                content_type TEXT,
                uploaded_by TEXT NOT NULL,
                uploaded_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_handover_record_time
            ON HANDOVER_RECORD (record_time DESC)
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_task_status_due
            ON TASK_ITEM (status, due_at)
            """
        )
        connection.commit()


def fetch_all_shift_groups():
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT *
            FROM SHIFT_GROUP
            ORDER BY sort_order, id
            """
        ).fetchall()


def insert_shift_group(payload: dict) -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO SHIFT_GROUP (
                name,
                start_time,
                end_time,
                sort_order,
                is_active,
                created_at,
                updated_at
            )
            VALUES (
                :name,
                :start_time,
                :end_time,
                :sort_order,
                :is_active,
                :created_at,
                :updated_at
            )
            """,
            payload,
        )
        connection.commit()
        return int(cursor.lastrowid)


def update_shift_group(shift_group_id: int, payload: dict) -> None:
    assignments = ", ".join(f"{field} = :{field}" for field in payload if field != "id")
    with get_connection() as connection:
        connection.execute(
            f"UPDATE SHIFT_GROUP SET {assignments} WHERE id = :id",
            {"id": shift_group_id, **payload},
        )
        connection.commit()


def fetch_setting_map() -> dict[str, str]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT key, value FROM SYSTEM_SETTING"
        ).fetchall()
    return {row["key"]: row["value"] for row in rows}


def upsert_setting(key: str, value, updated_at: str, updated_by: str) -> None:
    stored_value = json.dumps(value, ensure_ascii=False) if not isinstance(value, str) else value
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO SYSTEM_SETTING (key, value, updated_at, updated_by)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = excluded.updated_at,
                updated_by = excluded.updated_by
            """,
            (key, stored_value, updated_at, updated_by),
        )
        connection.commit()


def fetch_all_handover_records():
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT *
            FROM HANDOVER_RECORD
            ORDER BY record_time DESC, id DESC
            """
        ).fetchall()


def insert_handover_record(payload: dict) -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO HANDOVER_RECORD (
                title,
                shift_group_id,
                record_time,
                handover_user,
                receiver_user,
                work_summary,
                precautions,
                pending_items,
                keywords,
                created_by,
                created_at,
                updated_at
            )
            VALUES (
                :title,
                :shift_group_id,
                :record_time,
                :handover_user,
                :receiver_user,
                :work_summary,
                :precautions,
                :pending_items,
                :keywords,
                :created_by,
                :created_at,
                :updated_at
            )
            """,
            payload,
        )
        connection.commit()
        return int(cursor.lastrowid)


def update_handover_record(record_id: int, payload: dict) -> None:
    assignments = ", ".join(f"{field} = :{field}" for field in payload if field != "id")
    with get_connection() as connection:
        connection.execute(
            f"UPDATE HANDOVER_RECORD SET {assignments} WHERE id = :id",
            {"id": record_id, **payload},
        )
        connection.commit()


def fetch_handover_record(record_id: int):
    with get_connection() as connection:
        return connection.execute(
            "SELECT * FROM HANDOVER_RECORD WHERE id = ?",
            (record_id,),
        ).fetchone()


def fetch_all_tasks():
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT *
            FROM TASK_ITEM
            ORDER BY
                CASE status
                    WHEN '进行中' THEN 0
                    WHEN '未开始' THEN 1
                    WHEN '已完成' THEN 2
                    ELSE 3
                END,
                due_at,
                id DESC
            """
        ).fetchall()


def insert_task(payload: dict) -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO TASK_ITEM (
                title,
                description,
                status,
                priority,
                due_at,
                assignee_user,
                creator_user,
                handover_record_id,
                reminder_at,
                created_at,
                updated_at,
                completed_at
            )
            VALUES (
                :title,
                :description,
                :status,
                :priority,
                :due_at,
                :assignee_user,
                :creator_user,
                :handover_record_id,
                :reminder_at,
                :created_at,
                :updated_at,
                :completed_at
            )
            """,
            payload,
        )
        connection.commit()
        return int(cursor.lastrowid)


def update_task(task_id: int, payload: dict) -> None:
    assignments = ", ".join(f"{field} = :{field}" for field in payload if field != "id")
    with get_connection() as connection:
        connection.execute(
            f"UPDATE TASK_ITEM SET {assignments} WHERE id = :id",
            {"id": task_id, **payload},
        )
        connection.commit()


def fetch_task(task_id: int):
    with get_connection() as connection:
        return connection.execute(
            "SELECT * FROM TASK_ITEM WHERE id = ?",
            (task_id,),
        ).fetchone()


def insert_attachment(payload: dict) -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO ATTACHMENT (
                owner_type,
                owner_id,
                original_name,
                stored_name,
                stored_path,
                content_type,
                uploaded_by,
                uploaded_at
            )
            VALUES (
                :owner_type,
                :owner_id,
                :original_name,
                :stored_name,
                :stored_path,
                :content_type,
                :uploaded_by,
                :uploaded_at
            )
            """,
            payload,
        )
        connection.commit()
        return int(cursor.lastrowid)


def fetch_attachments_for_owner(owner_type: str, owner_id: int):
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT *
            FROM ATTACHMENT
            WHERE owner_type = ? AND owner_id = ?
            ORDER BY id DESC
            """,
            (owner_type, owner_id),
        ).fetchall()


def fetch_attachment(attachment_id: int):
    with get_connection() as connection:
        return connection.execute(
            "SELECT * FROM ATTACHMENT WHERE id = ?",
            (attachment_id,),
        ).fetchone()
