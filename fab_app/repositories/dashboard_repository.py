from __future__ import annotations

from fab_app.core.database import get_connection
from fab_app.models.dashboard import PAGE_DEFINITIONS, normalize_page


def fetch_rows_for_table(page: str, table_name: str):
    with get_connection(page=page) as connection:
        return connection.execute(f'SELECT * FROM "{table_name}"').fetchall()


def fetch_rows_for_page(page: str):
    normalized_page = normalize_page(page)
    page_definition = PAGE_DEFINITIONS[normalized_page]
    return {
        table_name: fetch_rows_for_table(normalized_page, table_name)
        for table_name in page_definition["tables"]
    }
