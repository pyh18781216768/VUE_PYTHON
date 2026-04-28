export function normalizeText(value) {
  return String(value ?? "").trim();
}

export function formatDashboardMetric(value, format = "decimal") {
  if (value === null || value === undefined || value === "") return "--";
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return String(value);
  if (format === "percent") return `${(numberValue * 100).toFixed(2)}%`;
  return numberValue.toFixed(3);
}

export function formatInteger(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue.toLocaleString("zh-Hans-CN") : "--";
}
