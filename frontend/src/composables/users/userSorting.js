import { createDefaultUserSorts } from "./userConstants";
import { getRoleLabel, normalizeComparable } from "./userFormatters";

function getValue(row, key) {
  return String(key)
    .split(".")
    .reduce((value, part) => (value && value[part] !== undefined ? value[part] : undefined), row);
}

function compareValue(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) return leftNumber - rightNumber;
  return normalizeComparable(left).localeCompare(normalizeComparable(right), "zh-Hant-TW");
}

export function filterUserRows(users, filters) {
  const keyword = normalizeComparable(filters.keyword);
  return users.filter((item) => {
    if (filters.role && item.role !== filters.role) return false;
    if (!keyword) return true;
    return [
      item.id,
      item.username,
      item.displayName,
      item.displayLabel,
      item.department,
      item.email,
      item.phone,
      item.supervisorLabel,
      getRoleLabel(item.role),
    ]
      .map(normalizeComparable)
      .some((text) => text.includes(keyword));
  });
}

export function sortUserRows(users, filters, sorts) {
  const rows = filterUserRows(users, filters);
  const activeSorts = sorts.length ? sorts : createDefaultUserSorts();
  return [...rows].sort((left, right) => {
    for (const sort of activeSorts) {
      const result = compareValue(getValue(left, sort.key), getValue(right, sort.key));
      if (result) return sort.direction === "asc" ? result : -result;
    }
    return 0;
  });
}

export function getNextUserSorts(currentSorts, key, event) {
  const existingIndex = currentSorts.findIndex((item) => item.key === key);
  const nextSorts = event?.shiftKey ? [...currentSorts] : [];

  if (existingIndex < 0) {
    nextSorts.push({ key, direction: "asc" });
  } else {
    const existing = currentSorts[existingIndex];
    if (existing.direction === "asc") {
      const next = { key, direction: "desc" };
      if (event?.shiftKey) nextSorts.splice(existingIndex, 1, next);
      else nextSorts.push(next);
    } else if (event?.shiftKey) {
      nextSorts.splice(existingIndex, 1);
    } else {
      nextSorts.push({ key, direction: "asc" });
    }
  }

  return nextSorts.length ? nextSorts : [{ key: "createdAt", direction: "desc" }];
}
