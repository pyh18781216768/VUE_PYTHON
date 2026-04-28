import { formatDashboardMetric, formatInteger, normalizeText } from "@/composables/dashboard/dashboardFormatters";

export function createFilterOptions(dimensions = {}, fields = []) {
  const output = {};
  for (const field of fields) {
    const values = dimensions[field.dimension] || [];
    if (field.key === "snapshotDate") {
      output[field.key] = [
        { value: "latest", label: "最新数据" },
        ...[...values].reverse().map((value) => ({ value, label: value })),
      ];
    } else {
      output[field.key] = values.map((value) => ({ value, label: value }));
    }
  }
  return output;
}

export function filterDashboardRecords(records = [], fields = [], filters = {}) {
  return records.filter((record) =>
    fields.every((field) => {
      if (field.key === "snapshotDate") return true;
      const expected = normalizeText(filters[field.key]);
      return !expected || normalizeText(record[field.key]) === expected;
    }),
  );
}

export function createTableRows(records = [], filters = {}, metricFormat = "decimal") {
  return records
    .map((record) => {
      const point = resolveDashboardPoint(record, filters.snapshotDate);
      if (!point) return null;
      return {
        ...record,
        snapshotDate: point.date,
        metricValue: point.metricValue,
        severityValue: point.severityValue,
        inputCount: point.inputCount ?? "--",
        failCount: point.failCount ?? "--",
        metricDisplay: formatDashboardMetric(point.metricValue, metricFormat),
        severityDisplay: formatDashboardMetric(point.severityValue, "decimal"),
      };
    })
    .filter(Boolean);
}

export function sortDashboardRows(rows = [], sorts = []) {
  const activeSorts = sorts.length ? sorts : [{ key: "severityValue", direction: "desc" }];
  return [...rows].sort((left, right) => {
    for (const sort of activeSorts) {
      const result = compareValue(getValue(left, sort.key), getValue(right, sort.key));
      if (result) return sort.direction === "asc" ? result : -result;
    }
    return 0;
  });
}

export function createMetricCards(tableRows = [], dashboard = {}) {
  return [
    {
      title: "筛选记录",
      value: formatInteger(tableRows.length),
      subtitle: `全部记录 ${formatInteger(dashboard.recordCount)}`,
      accent: "cyan",
    },
    {
      title: "数据点",
      value: formatInteger(dashboard.pointCount),
      subtitle: "当前参数历史点数量",
      accent: "blue",
    },
    {
      title: "最新日期",
      value: dashboard.latestAvailableDate || "--",
      subtitle: "后端可用的最新快照",
      accent: "green",
    },
    {
      title: "数据库行数",
      value: formatInteger(dashboard.databaseRowCount),
      subtitle: "源表合计行数",
      accent: "amber",
    },
  ];
}

export function createTrendRows(records = []) {
  const buckets = new Map();
  for (const record of records) {
    for (const point of record.values || []) {
      const bucket = buckets.get(point.date) || { date: point.date, weightedTotal: 0, inputTotal: 0, valueTotal: 0, count: 0 };
      const severity = Number(point.severityValue ?? point.metricValue ?? 0);
      const input = Number(point.inputCount || 0);
      bucket.weightedTotal += severity * input;
      bucket.inputTotal += input;
      bucket.valueTotal += severity;
      bucket.count += 1;
      buckets.set(point.date, bucket);
    }
  }
  return [...buckets.values()]
    .sort((left, right) => normalizeText(left.date).localeCompare(normalizeText(right.date)))
    .map((bucket) => ({
      date: bucket.date,
      value: bucket.inputTotal ? bucket.weightedTotal / bucket.inputTotal : bucket.valueTotal / Math.max(bucket.count, 1),
    }));
}

export function createCategoryRows(tableRows = []) {
  const buckets = new Map();
  for (const row of tableRows) {
    const key = row.category || "--";
    const bucket = buckets.get(key) || { name: key, weightedTotal: 0, inputTotal: 0, valueTotal: 0, count: 0 };
    const severity = Number(row.severityValue ?? row.metricValue ?? 0);
    const input = Number(row.inputCount || 0);
    bucket.weightedTotal += severity * input;
    bucket.inputTotal += input;
    bucket.valueTotal += severity;
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()]
    .map((bucket) => ({
      name: bucket.name,
      value: bucket.inputTotal ? bucket.weightedTotal / bucket.inputTotal : bucket.valueTotal / Math.max(bucket.count, 1),
    }))
    .sort((left, right) => right.value - left.value);
}

export function createTopRows(tableRows = []) {
  return tableRows
    .slice(0, 12)
    .map((row) => ({
      name: row.recordLabel || [row.category, row.aaMC, row.stn || row.config || row.aaTime].filter(Boolean).join(" / "),
      value: Number(row.severityValue ?? row.metricValue ?? 0),
    }))
    .reverse();
}

export function createExportFilters(fields = [], filters = {}) {
  const output = {};
  for (const field of fields) {
    const value = normalizeText(filters[field.key]);
    if (value) output[field.key] = value;
  }
  if (!output.snapshotDate) output.snapshotDate = "latest";
  return output;
}

export function resolveDashboardPoint(record, snapshotDate = "latest") {
  const values = record.values || [];
  if (!values.length) return null;
  const normalizedSnapshotDate = snapshotDate || "latest";
  if (normalizedSnapshotDate === "latest") return values[values.length - 1];
  return values.find((point) => point.date === normalizedSnapshotDate) || null;
}

function compareValue(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) return leftNumber - rightNumber;
  return normalizeText(left).localeCompare(normalizeText(right), "zh-Hans-CN");
}

function getValue(row, key) {
  return String(key)
    .split(".")
    .reduce((value, part) => (value && value[part] !== undefined ? value[part] : undefined), row);
}
