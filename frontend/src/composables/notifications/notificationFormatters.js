export function normalizeText(value) {
  return String(value ?? "").trim();
}

export function parseTime(value) {
  const text = normalizeText(value);
  if (!text) return 0;
  const timestamp = new Date(text).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function formatDateTime(value) {
  const text = normalizeText(value).replace("T", " ");
  return text ? text.slice(0, 16) : "--";
}

export function formatReminderRemaining(item) {
  const targetTime = parseTime(item?.startTime || item?.reminderTime || item?.dueAt || item?.reviewedAt);
  if (!targetTime) return "--";
  const diffMs = targetTime - Date.now();
  if (diffMs <= 0) return "已到期";
  const totalHours = Math.floor(diffMs / 36e5);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days}天${String(hours).padStart(2, "0")}小时`;
}

export function createHandoverRecordLabel(recordId, handovers, formatValue = formatDateTime) {
  const normalizedId = Number(recordId);
  const record = handovers.find((item) => Number(item.id) === normalizedId);
  if (!record) return recordId ? `#${recordId}` : "--";
  const people = [record.handoverUser, record.receiverUser].filter(Boolean).join(" → ");
  return [
    `#${record.id}`,
    record.keywords,
    record.shiftName,
    record.receiverShiftName,
    record.floorName,
    people,
    formatValue(record.createdAt || record.recordTime),
  ]
    .filter(Boolean)
    .join(" / ");
}
