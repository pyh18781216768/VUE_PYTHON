from __future__ import annotations

from fab_app.core.database import get_connection


USER_COLUMNS = {
    "user": "TEXT PRIMARY KEY",
    "password": "TEXT",
    "display_name": "TEXT",
    "email": "TEXT",
    "phone": "TEXT",
    "department": "TEXT",
    "role": "TEXT DEFAULT 'user'",
    "is_active": "INTEGER DEFAULT 1",
    "shift_group_id": "INTEGER",
    "created_at": "TEXT",
    "updated_at": "TEXT",
}


def ensure_user_table() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS USER (
                user TEXT PRIMARY KEY,
                password TEXT,
                display_name TEXT,
                email TEXT,
                phone TEXT,
                department TEXT,
                role TEXT DEFAULT 'user',
                is_active INTEGER DEFAULT 1,
                shift_group_id INTEGER,
                created_at TEXT,
                updated_at TEXT
            )
            """
        )
        existing_columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(USER)").fetchall()
        }
        for column_name, column_definition in USER_COLUMNS.items():
            if column_name in existing_columns:
                continue
            connection.execute(
                f'ALTER TABLE USER ADD COLUMN "{column_name}" {column_definition}'
            )
        connection.commit()


def fetch_all_users():
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT
                rowid,
                user,
                password,
                display_name,
                email,
                phone,
                department,
                role,
                is_active,
                shift_group_id,
                created_at,
                updated_at
            FROM USER
            ORDER BY user
            """
        ).fetchall()


def fetch_user(username: str):
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT
                rowid,
                user,
                password,
                display_name,
                email,
                phone,
                department,
                role,
                is_active,
                shift_group_id,
                created_at,
                updated_at
            FROM USER
            WHERE user = ?
            """,
            (username,),
        ).fetchone()


def insert_user(payload: dict) -> None:
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO USER (
                user,
                password,
                display_name,
                email,
                phone,
                department,
                role,
                is_active,
                shift_group_id,
                created_at,
                updated_at
            )
            VALUES (
                :user,
                :password,
                :display_name,
                :email,
                :phone,
                :department,
                :role,
                :is_active,
                :shift_group_id,
                :created_at,
                :updated_at
            )
            """,
            payload,
        )
        connection.commit()


def update_user_row(row_id: int, payload: dict) -> None:
    assignments = ", ".join(f"{field} = :{field}" for field in payload if field != "rowid")
    with get_connection() as connection:
        connection.execute(
            f"UPDATE USER SET {assignments} WHERE rowid = :rowid",
            payload,
        )
        connection.commit()


def update_user_by_username(username: str, payload: dict) -> None:
    assignments = ", ".join(f"{field} = :{field}" for field in payload if field != "user")
    with get_connection() as connection:
        payload = {**payload, "user": username}
        connection.execute(
            f"UPDATE USER SET {assignments} WHERE user = :user",
            payload,
        )
        connection.commit()
