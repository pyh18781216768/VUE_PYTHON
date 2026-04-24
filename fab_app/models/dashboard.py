from __future__ import annotations


SUPPORTED_PAGES = ("angle", "oc", "lens")

PAGE_DEFINITIONS = {
    "angle": {
        "title": "Angle Dashboard",
        "tables": ("MW_Angle_X", "MW_Angle_Y"),
        "thresholds": {"yellow": 0.10, "red": 0.30, "mode": "percent"},
        "metric_format": "percent",
        "metric_label": "OOS Rate",
        "filter_keys": ("source", "category", "project", "vendor", "aaMC", "stn", "snapshotDate"),
    },
    "oc": {
        "title": "OC Series Dashboard",
        "tables": ("BWI_OC_X", "BWI_OC_Y", "CHS_OC_X", "CHS_OC_Y", "MW_OC_X", "MW_OC_Y"),
        "thresholds": {"yellow": 1.0, "red": 2.5, "mode": "number"},
        "metric_format": "decimal",
        "metric_label": "|OC|",
        "filter_keys": ("source", "category", "project", "aaMC", "stn", "snapshotDate"),
    },
    "lens": {
        "title": "Lens Series Dashboard",
        "tables": ("BWI_LensPP", "MW_LensPP"),
        "thresholds": {"yellow": 1.0, "red": 3.0, "mode": "percent"},
        "metric_format": "percent",
        "metric_label": "Fail Rate",
        "filter_keys": ("source", "category", "config", "project", "aaMC", "aaTime", "snapshotDate"),
    },
}


def normalize_page(page: str | None) -> str:
    normalized_page = str(page or "angle").strip().lower()
    if normalized_page not in SUPPORTED_PAGES:
        raise ValueError(f"Unsupported page: {normalized_page}")
    return normalized_page
