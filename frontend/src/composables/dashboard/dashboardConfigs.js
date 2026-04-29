import { unref } from "vue";

import { normalizeText } from "@/composables/dashboard/dashboardFormatters";

export const DASHBOARD_CONFIGS = {
  oc: {
    title: "OC 參數",
    kicker: "OC",
    subtitle: "按 OC_X / OC_Y 追蹤目前快照、趨勢與高風險組合。",
    metricName: "|OC|",
    metricFormat: "decimal",
    exportFilename: "oc_parameters.xlsx",
    exportColumns: ["source", "category", "project", "aaMC", "stn", "date", "metricValue", "severityValue", "inputCount"],
    filters: [
      { key: "source", label: "Source", dimension: "sources" },
      { key: "category", label: "Series", dimension: "categories" },
      { key: "project", label: "Project", dimension: "projects" },
      { key: "aaMC", label: "AA MC", dimension: "aaMCs" },
      { key: "stn", label: "STN", dimension: "stations" },
      { key: "snapshotDate", label: "快照日期", dimension: "dateLabels" },
    ],
    tableColumns: [
      { key: "source", label: "Source", sortable: true },
      { key: "category", label: "Series", sortable: true },
      { key: "project", label: "Project", sortable: true },
      { key: "aaMC", label: "AA MC", sortable: true },
      { key: "stn", label: "STN", sortable: true },
      { key: "snapshotDate", label: "日期", sortable: true },
      { key: "metricDisplay", label: "OC 值", sortable: true },
      { key: "severityDisplay", label: "|OC|", sortable: true },
      { key: "inputCount", label: "Input", sortable: true },
    ],
  },
  angle: {
    title: "Angle 參數",
    kicker: "ANGLE",
    subtitle: "按 Angle_X / Angle_Y 追踪 OOS Rate、投入与 Fail。",
    metricName: "OOS Rate",
    metricFormat: "percent",
    exportFilename: "angle_parameters.xlsx",
    exportColumns: ["source", "category", "project", "vendor", "aaMC", "stn", "date", "metricValue", "failCount", "inputCount"],
    filters: [
      { key: "source", label: "Source", dimension: "sources" },
      { key: "category", label: "Angle", dimension: "categories" },
      { key: "project", label: "Project", dimension: "projects" },
      { key: "vendor", label: "Vendor", dimension: "vendors" },
      { key: "aaMC", label: "AA MC", dimension: "aaMCs" },
      { key: "stn", label: "STN", dimension: "stations" },
      { key: "snapshotDate", label: "快照日期", dimension: "dateLabels" },
    ],
    tableColumns: [
      { key: "source", label: "Source", sortable: true },
      { key: "category", label: "Angle", sortable: true },
      { key: "project", label: "Project", sortable: true },
      { key: "vendor", label: "Vendor", sortable: true },
      { key: "aaMC", label: "AA MC", sortable: true },
      { key: "stn", label: "STN", sortable: true },
      { key: "snapshotDate", label: "日期", sortable: true },
      { key: "metricDisplay", label: "OOS Rate", sortable: true },
      { key: "failCount", label: "Fail", sortable: true },
      { key: "inputCount", label: "Input", sortable: true },
    ],
  },
  lens: {
    title: "Lens 參數",
    kicker: "LENS",
    subtitle: "按 Lens PP、Config 与 AA Time 追踪 Fail Rate。",
    metricName: "Fail Rate",
    metricFormat: "percent",
    exportFilename: "lens_parameters.xlsx",
    exportColumns: ["source", "category", "config", "project", "aaMC", "aaTime", "date", "metricValue", "failCount", "inputCount"],
    filters: [
      { key: "source", label: "Source", dimension: "sources" },
      { key: "category", label: "Lens PP", dimension: "categories" },
      { key: "config", label: "Config", dimension: "configs" },
      { key: "project", label: "Project", dimension: "projects" },
      { key: "aaMC", label: "AA MC", dimension: "aaMCs" },
      { key: "aaTime", label: "AA Time", dimension: "aaTimes" },
      { key: "snapshotDate", label: "快照日期", dimension: "dateLabels" },
    ],
    tableColumns: [
      { key: "source", label: "Source", sortable: true },
      { key: "category", label: "Lens PP", sortable: true },
      { key: "config", label: "Config", sortable: true },
      { key: "project", label: "Project", sortable: true },
      { key: "aaMC", label: "AA MC", sortable: true },
      { key: "aaTime", label: "AA Time", sortable: true },
      { key: "snapshotDate", label: "Test Time", sortable: true },
      { key: "metricDisplay", label: "Fail Rate", sortable: true },
      { key: "failCount", label: "Fail", sortable: true },
      { key: "inputCount", label: "Input", sortable: true },
    ],
  },
};

export function normalizeDashboardPage(page) {
  const normalized = normalizeText(unref(page)).toLowerCase();
  return DASHBOARD_CONFIGS[normalized] ? normalized : "oc";
}

export function createEmptyDashboard(page) {
  return {
    page,
    title: "",
    generatedAt: "",
    databasePath: "",
    recordCount: 0,
    pointCount: 0,
    databaseRowCount: 0,
    latestAvailableDate: "",
    metricFormat: DASHBOARD_CONFIGS[page]?.metricFormat || "decimal",
    metricLabel: DASHBOARD_CONFIGS[page]?.metricName || "",
    dimensions: {},
    records: [],
    tables: [],
    thresholds: {},
  };
}
