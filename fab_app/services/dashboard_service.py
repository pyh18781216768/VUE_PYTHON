from __future__ import annotations

from datetime import datetime
from functools import lru_cache
from typing import Any

from fab_app.core.database import get_database_path
from fab_app.models.dashboard import PAGE_DEFINITIONS, SUPPORTED_PAGES, normalize_page
from fab_app.repositories.dashboard_repository import fetch_rows_for_page


def get_supported_pages() -> tuple[str, ...]:
    return SUPPORTED_PAGES


def get_dashboard_data(page: str = "angle", refresh: bool = False) -> dict[str, Any]:
    normalized_page = normalize_page(page)
    if refresh:
        _cached_dashboard_data.cache_clear()
    return _cached_dashboard_data(normalized_page)


def get_filtered_export_rows(page: str, filters: dict[str, Any] | None = None, refresh: bool = False):
    dashboard = get_dashboard_data(page=page, refresh=refresh)
    normalized_filters = _normalize_filters(filters or {})
    rows: list[dict[str, Any]] = []

    for record in dashboard["records"]:
        if not _record_matches(record, normalized_filters, dashboard["page"]):
            continue

        point = _resolve_point(record["values"], normalized_filters.get("snapshotDate", "latest"))
        if not point:
            continue

        row = {key: record.get(key, "") for key in record.get("exportBaseFields", [])}
        row.update(
            {
                "date": point["date"],
                "metricValue": point["metricValue"],
                "severityValue": point["severityValue"],
                "inputCount": point["inputCount"],
                "failCount": point["failCount"],
            }
        )
        rows.append(row)

    return rows


@lru_cache(maxsize=len(SUPPORTED_PAGES))
def _cached_dashboard_data(page: str) -> dict[str, Any]:
    raw_tables = fetch_rows_for_page(page)
    if page == "angle":
        return _load_angle_dashboard(raw_tables)
    if page == "oc":
        return _load_oc_dashboard(raw_tables)
    return _load_lens_dashboard(raw_tables)


def _load_angle_dashboard(raw_tables: dict[str, Any]) -> dict[str, Any]:
    records_by_key: dict[tuple[str, ...], dict[str, Any]] = {}
    date_labels: set[str] = set()
    table_rows = []

    for table_name, rows in raw_tables.items():
        source = table_name.split("_", 1)[0]
        category = "Angle_X" if table_name.endswith("_X") else "Angle_Y"
        table_rows.append({"source": source, "tableName": table_name, "rowCount": len(rows)})

        for row in rows:
            data = _normalize_row(row)
            date = _normalize_text(data.get("TestTime"))
            if not date:
                continue

            project = _normalize_text(data.get("Project"))
            vendor = _normalize_text(data.get("Vendor"))
            aa_mc = _normalize_text(data.get("AA MC"))
            stn = _normalize_text(data.get("STN") or data.get(" STN"))
            fail_count = _safe_int(data.get("Fail"))
            input_count = _safe_int(data.get("Input"))
            metric_value = _safe_float(data.get("Rate"))
            severity_value = metric_value if metric_value is not None else 0.0

            key = (source, category, project, vendor, aa_mc, stn)
            record = records_by_key.get(key)
            if record is None:
                record = {
                    "source": source,
                    "category": category,
                    "project": project,
                    "vendor": vendor,
                    "aaMC": aa_mc,
                    "stn": stn,
                    "config": "",
                    "aaTime": "",
                    "recordLabel": f"{category} / {aa_mc} / {stn}",
                    "exportBaseFields": ("source", "category", "project", "vendor", "aaMC", "stn"),
                    "values": [],
                }
                records_by_key[key] = record

            record["values"].append(
                {
                    "date": date,
                    "metricValue": metric_value,
                    "severityValue": severity_value,
                    "inputCount": input_count,
                    "failCount": fail_count,
                }
            )
            date_labels.add(date)

    records = _finalize_records(records_by_key)
    dimensions = _build_dimensions(
        records,
        date_labels,
        {
            "sources": "source",
            "categories": "category",
            "projects": "project",
            "vendors": "vendor",
            "aaMCs": "aaMC",
            "stations": "stn",
        },
    )
    return _build_dashboard_payload("angle", records, dimensions, table_rows)


def _load_oc_dashboard(raw_tables: dict[str, Any]) -> dict[str, Any]:
    records_by_key: dict[tuple[str, ...], dict[str, Any]] = {}
    date_labels: set[str] = set()
    table_rows = []

    for table_name, rows in raw_tables.items():
        source = table_name.split("_", 1)[0]
        category = "OC_X" if table_name.endswith("_X") else "OC_Y"
        metric_column = category
        table_rows.append({"source": source, "tableName": table_name, "rowCount": len(rows)})

        for row in rows:
            data = _normalize_row(row)
            date = _normalize_text(data.get("Result"))
            if not date:
                continue

            project = _normalize_text(data.get("Project"))
            aa_mc = _normalize_text(data.get("AA MC"))
            stn = _normalize_text(data.get("STN"))
            input_count = _safe_int(data.get("Input"))
            metric_value = _safe_float(data.get(metric_column))
            severity_value = abs(metric_value) if metric_value is not None else 0.0

            key = (source, category, project, aa_mc, stn)
            record = records_by_key.get(key)
            if record is None:
                record = {
                    "source": source,
                    "category": category,
                    "project": project,
                    "vendor": "",
                    "aaMC": aa_mc,
                    "stn": stn,
                    "config": "",
                    "aaTime": "",
                    "recordLabel": f"{category} / {aa_mc} / {stn}",
                    "exportBaseFields": ("source", "category", "project", "aaMC", "stn"),
                    "values": [],
                }
                records_by_key[key] = record

            record["values"].append(
                {
                    "date": date,
                    "metricValue": metric_value,
                    "severityValue": severity_value,
                    "inputCount": input_count,
                    "failCount": None,
                }
            )
            date_labels.add(date)

    records = _finalize_records(records_by_key)
    dimensions = _build_dimensions(
        records,
        date_labels,
        {
            "sources": "source",
            "categories": "category",
            "projects": "project",
            "aaMCs": "aaMC",
            "stations": "stn",
        },
    )
    return _build_dashboard_payload("oc", records, dimensions, table_rows)


def _load_lens_dashboard(raw_tables: dict[str, Any]) -> dict[str, Any]:
    records_by_key: dict[tuple[str, ...], dict[str, Any]] = {}
    date_labels: set[str] = set()
    table_rows = []

    for table_name, rows in raw_tables.items():
        source = table_name.split("_", 1)[0]
        table_rows.append({"source": source, "tableName": table_name, "rowCount": len(rows)})

        for row in rows:
            data = _normalize_row(row)
            date = _normalize_text(data.get("TestTime"))
            if not date:
                continue

            category = _normalize_text(data.get("Lens_PP"))
            config = _normalize_text(data.get("Config"))
            project = _normalize_text(data.get("Project"))
            aa_mc = _normalize_text(data.get("AA MC"))
            aa_time = _normalize_text(data.get("AATime"))
            input_count = _safe_int(data.get("Input"))
            fail_count = _safe_int(data.get("Fail"))
            metric_value = _safe_divide(fail_count or 0, input_count or 0)
            severity_value = metric_value if metric_value is not None else 0.0

            key = (source, category, config, project, aa_mc, aa_time)
            record = records_by_key.get(key)
            if record is None:
                record = {
                    "source": source,
                    "category": category,
                    "project": project,
                    "vendor": "",
                    "aaMC": aa_mc,
                    "stn": "",
                    "config": config,
                    "aaTime": aa_time,
                    "recordLabel": f"{category} / {config} / {aa_mc}",
                    "exportBaseFields": ("source", "category", "config", "project", "aaMC", "aaTime"),
                    "values": [],
                }
                records_by_key[key] = record

            record["values"].append(
                {
                    "date": date,
                    "metricValue": metric_value,
                    "severityValue": severity_value,
                    "inputCount": input_count,
                    "failCount": fail_count,
                }
            )
            date_labels.add(date)

    records = _finalize_records(records_by_key)
    dimensions = _build_dimensions(
        records,
        date_labels,
        {
            "sources": "source",
            "categories": "category",
            "configs": "config",
            "projects": "project",
            "aaMCs": "aaMC",
            "aaTimes": "aaTime",
        },
    )
    return _build_dashboard_payload("lens", records, dimensions, table_rows)


def _build_dashboard_payload(page: str, records, dimensions, table_rows) -> dict[str, Any]:
    definition = PAGE_DEFINITIONS[page]
    total_points = sum(len(record["values"]) for record in records)
    total_rows = sum(item["rowCount"] for item in table_rows)
    return {
        "page": page,
        "title": definition["title"],
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "databasePath": str(get_database_path(page)),
        "recordCount": len(records),
        "pointCount": total_points,
        "tableCount": len(table_rows),
        "databaseRowCount": total_rows,
        "latestAvailableDate": dimensions["dateLabels"][-1] if dimensions["dateLabels"] else None,
        "thresholds": definition["thresholds"],
        "metricFormat": definition["metric_format"],
        "metricLabel": definition["metric_label"],
        "filterKeys": definition["filter_keys"],
        "dimensions": dimensions,
        "tables": table_rows,
        "records": records,
    }


def _finalize_records(records_by_key: dict[tuple[str, ...], dict[str, Any]]):
    records = []
    for record in records_by_key.values():
        record["values"].sort(key=lambda item: item["date"])
        total_input = sum(item["inputCount"] or 0 for item in record["values"])
        total_fail = sum(item["failCount"] or 0 for item in record["values"])
        severity_numerator = sum((item["severityValue"] or 0) * (item["inputCount"] or 0) for item in record["values"])
        latest = record["values"][-1] if record["values"] else None
        record["latestDate"] = latest["date"] if latest else ""
        record["latestMetricValue"] = latest["metricValue"] if latest else None
        record["latestSeverityValue"] = latest["severityValue"] if latest else None
        record["totalInput"] = total_input
        record["totalFail"] = total_fail
        record["weightedSeverity"] = _safe_divide(severity_numerator, total_input) if total_input else None
        records.append(record)

    records.sort(
        key=lambda item: (
            item.get("source", ""),
            item.get("category", ""),
            item.get("project", ""),
            item.get("aaMC", ""),
            item.get("stn", ""),
            item.get("config", ""),
            item.get("aaTime", ""),
        )
    )
    return records


def _build_dimensions(records, date_labels, mapping: dict[str, str]):
    dimensions = {key: [] for key in mapping}
    for dimension_key, field_name in mapping.items():
        values = sorted({_normalize_text(record.get(field_name)) for record in records if _normalize_text(record.get(field_name))})
        dimensions[dimension_key] = values
    dimensions["dateLabels"] = sorted(date_labels)
    return dimensions


def _record_matches(record: dict[str, Any], filters: dict[str, str], page: str) -> bool:
    match_keys = [key for key in PAGE_DEFINITIONS[page]["filter_keys"] if key != "snapshotDate"]
    for key in match_keys:
        expected = filters.get(key, "")
        if not expected:
            continue
        if _normalize_text(record.get(key)) != expected:
            return False
    return True


def _resolve_point(values: list[dict[str, Any]], snapshot_date: str):
    if not values:
        return None
    if snapshot_date == "latest":
        return values[-1]
    for point in values:
        if point["date"] == snapshot_date:
            return point
    return None


def _normalize_filters(filters: dict[str, Any]) -> dict[str, str]:
    normalized = {key: _normalize_text(value) for key, value in filters.items()}
    normalized["snapshotDate"] = normalized.get("snapshotDate") or "latest"
    return normalized


def _normalize_row(row) -> dict[str, Any]:
    return {str(key).strip(): value for key, value in dict(row).items()}


def _normalize_text(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _safe_int(value) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _safe_float(value) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_divide(numerator: float, denominator: float) -> float | None:
    if not denominator:
        return None
    return numerator / denominator
