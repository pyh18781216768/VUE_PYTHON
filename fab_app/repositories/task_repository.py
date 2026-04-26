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
            CREATE TABLE IF NOT EXISTS FLOOR_SETTING (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                sort_order INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS DEPARTMENT_SETTING (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                sort_order INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS HANDOVER_RECORD (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                shift_group_id INTEGER,
                floor_id INTEGER,
                record_time TEXT NOT NULL,
                handover_user TEXT NOT NULL,
                receiver_user TEXT NOT NULL,
                work_summary TEXT,
                precautions TEXT,
                pending_items TEXT,
                keywords TEXT,
                mention_users TEXT,
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        _ensure_column(connection, "HANDOVER_RECORD", "floor_id", "INTEGER")
        _ensure_column(connection, "HANDOVER_RECORD", "mention_users", "TEXT")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS TASK_ITEM (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL,
                priority TEXT NOT NULL,
                start_at TEXT,
                due_at TEXT,
                assignee_user TEXT,
                mention_users TEXT,
                creator_user TEXT NOT NULL,
                handover_record_id INTEGER,
                reminder_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                completed_at TEXT,
                reject_reason TEXT,
                rejected_by TEXT,
                rejected_at TEXT
            )
            """
        )
        _ensure_column(connection, "TASK_ITEM", "start_at", "TEXT")
        _ensure_column(connection, "TASK_ITEM", "mention_users", "TEXT")
        _ensure_column(connection, "TASK_ITEM", "reject_reason", "TEXT")
        _ensure_column(connection, "TASK_ITEM", "rejected_by", "TEXT")
        _ensure_column(connection, "TASK_ITEM", "rejected_at", "TEXT")
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
            CREATE TABLE IF NOT EXISTS OPERATION_LOG (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                operator_user TEXT,
                operator_label TEXT,
                operated_at TEXT NOT NULL,
                page_name TEXT NOT NULL,
                action_type TEXT NOT NULL,
                record_label TEXT NOT NULL,
                record_id TEXT
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
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_operation_log_time
            ON OPERATION_LOG (operated_at DESC, id DESC)
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_operation_log_operator
            ON OPERATION_LOG (operator_user, operated_at DESC)
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_operation_log_action
            ON OPERATION_LOG (action_type, operated_at DESC)
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


def fetch_shift_group(shift_group_id: int):
    with get_connection() as connection:
        return connection.execute(
            "SELECT * FROM SHIFT_GROUP WHERE id = ?",
            (shift_group_id,),
        ).fetchone()


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


def delete_shift_group(shift_group_id: int) -> None:
    with get_connection() as connection:
        connection.execute("DELETE FROM SHIFT_GROUP WHERE id = ?", (shift_group_id,))
        connection.commit()


def fetch_all_floors():
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT *
            FROM FLOOR_SETTING
            ORDER BY sort_order, id
            """
        ).fetchall()


def fetch_floor(floor_id: int):
    with get_connection() as connection:
        return connection.execute(
            "SELECT * FROM FLOOR_SETTING WHERE id = ?",
            (floor_id,),
        ).fetchone()


def fetch_floor_by_name(name: str):
    with get_connection() as connection:
        return connection.execute(
            "SELECT * FROM FLOOR_SETTING WHERE name = ?",
            (name,),
        ).fetchone()


def insert_floor(payload: dict) -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO FLOOR_SETTING (
                name,
                sort_order,
                created_at,
                updated_at
            )
            VALUES (
                :name,
                :sort_order,
                :created_at,
                :updated_at
            )
            """,
            payload,
        )
        connection.commit()
        return int(cursor.lastrowid)


def delete_floor(floor_id: int) -> None:
    with get_connection() as connection:
        connection.execute("DELETE FROM FLOOR_SETTING WHERE id = ?", (floor_id,))
        connection.commit()


def fetch_all_departments():
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT *
            FROM DEPARTMENT_SETTING
            ORDER BY sort_order, id
            """
        ).fetchall()


def fetch_department(department_id: int):
    with get_connection() as connection:
        return connection.execute(
            "SELECT * FROM DEPARTMENT_SETTING WHERE id = ?",
            (department_id,),
        ).fetchone()


def fetch_department_by_name(name: str):
    with get_connection() as connection:
        return connection.execute(
            "SELECT * FROM DEPARTMENT_SETTING WHERE name = ?",
            (name,),
        ).fetchone()


def insert_department(payload: dict) -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO DEPARTMENT_SETTING (
                name,
                sort_order,
                created_at,
                updated_at
            )
            VALUES (
                :name,
                :sort_order,
                :created_at,
                :updated_at
            )
            """,
            payload,
        )
        connection.commit()
        return int(cursor.lastrowid)


def delete_department(department_id: int) -> None:
    with get_connection() as connection:
        connection.execute("DELETE FROM DEPARTMENT_SETTING WHERE id = ?", (department_id,))
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
                floor_id,
                record_time,
                handover_user,
                receiver_user,
                work_summary,
                precautions,
                pending_items,
                keywords,
                mention_users,
                created_by,
                created_at,
                updated_at
            )
            VALUES (
                :title,
                :shift_group_id,
                :floor_id,
                :record_time,
                :handover_user,
                :receiver_user,
                :work_summary,
                :precautions,
                :pending_items,
                :keywords,
                :mention_users,
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


def delete_handover_record(record_id: int) -> None:
    with get_connection() as connection:
        connection.execute(
            "UPDATE TASK_ITEM SET handover_record_id = NULL WHERE handover_record_id = ?",
            (record_id,),
        )
        connection.execute(
            "DELETE FROM ATTACHMENT WHERE owner_type = ? AND owner_id = ?",
            ("handover", record_id),
        )
        connection.execute(
            "DELETE FROM HANDOVER_RECORD WHERE id = ?",
            (record_id,),
        )
        connection.commit()


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
                    WHEN '已驳回' THEN 3
                    ELSE 4
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
                start_at,
                due_at,
                assignee_user,
                mention_users,
                creator_user,
                handover_record_id,
                reminder_at,
                created_at,
                updated_at,
                completed_at,
                reject_reason,
                rejected_by,
                rejected_at
            )
            VALUES (
                :title,
                :description,
                :status,
                :priority,
                :start_at,
                :due_at,
                :assignee_user,
                :mention_users,
                :creator_user,
                :handover_record_id,
                :reminder_at,
                :created_at,
                :updated_at,
                :completed_at,
                :reject_reason,
                :rejected_by,
                :rejected_at
            )
            """,
            payload,
        )
        connection.commit()
        return int(cursor.lastrowid)


def _ensure_column(connection, table_name: str, column_name: str, column_type: str) -> None:
    columns = {
        row["name"]
        for row in connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    }
    if column_name not in columns:
        connection.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")


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


def delete_task(task_id: int) -> None:
    with get_connection() as connection:
        connection.execute(
            "DELETE FROM ATTACHMENT WHERE owner_type = ? AND owner_id = ?",
            ("task", task_id),
        )
        connection.execute(
            "DELETE FROM TASK_ITEM WHERE id = ?",
            (task_id,),
        )
        connection.commit()


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


def fetch_attachments_by_owner_type(owner_type: str):
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT *
            FROM ATTACHMENT
            WHERE owner_type = ?
            ORDER BY owner_id, id DESC
            """,
            (owner_type,),
        ).fetchall()


def fetch_attachment(attachment_id: int):
    with get_connection() as connection:
        return connection.execute(
            "SELECT * FROM ATTACHMENT WHERE id = ?",
            (attachment_id,),
        ).fetchone()


def insert_operation_log(payload: dict) -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO OPERATION_LOG (
                operator_user,
                operator_label,
                operated_at,
                page_name,
                action_type,
                record_label,
                record_id
            )
            VALUES (
                :operator_user,
                :operator_label,
                :operated_at,
                :page_name,
                :action_type,
                :record_label,
                :record_id
            )
            """,
            payload,
        )
        connection.commit()
        return int(cursor.lastrowid)


def fetch_all_operation_logs():
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT *
            FROM OPERATION_LOG
            ORDER BY operated_at DESC, id DESC
            """
        ).fetchall()
