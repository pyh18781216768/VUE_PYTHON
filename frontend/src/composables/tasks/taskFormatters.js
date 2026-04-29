export function normalizeText(value) {
  return String(value ?? "").trim();
}

export function normalizeComparable(value) {
  return normalizeText(value).toLowerCase();
}

export function userOptionLabel(user) {
  return user.displayLabel && user.displayLabel !== user.username
    ? `${user.displayLabel} / ${user.username}`
    : user.username;
}

export function toDateTimeLocal(value) {
  return normalizeText(value).replace(" ", "T").slice(0, 16);
}

export function formatDateTime(value) {
  const text = normalizeText(value).replace("T", " ");
  return text ? text.slice(0, 16) : "--";
}

const TASK_STATUS_LABELS = {
  "未开始": "未開始",
  "进行中": "進行中",
  "待审核": "待審核",
  "已完成": "已完成",
  "已驳回": "已駁回",
};

export function formatTaskStatusLabel(status) {
  return TASK_STATUS_LABELS[status] || status || "--";
}

export function getTaskStatusBoxClass(status) {
  if (status === "已驳回") return "task-color-box-rejected";
  if (status === "已完成") return "task-color-box-done";
  if (status === "待审核") return "task-color-box-review";
  if (status === "进行中") return "task-color-box-active";
  return "task-color-box-pending";
}

export function getTaskPriorityBoxClass(priority) {
  if (priority === "高") return "task-color-box-high";
  if (priority === "低") return "task-color-box-low";
  return "task-color-box-medium";
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
