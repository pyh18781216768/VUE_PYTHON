import { createDefaultHandoverSorts } from "./handoverConstants";
import { normalizeComparable } from "./handoverFormatters";

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

export function sortHandoverRows(rows, sorts) {
  const activeSorts = sorts.length ? sorts : createDefaultHandoverSorts();
  return [...rows].sort((left, right) => {
    for (const sort of activeSorts) {
      const result = compareValue(getValue(left, sort.key), getValue(right, sort.key));
      if (result) return sort.direction === "asc" ? result : -result;
    }
    return 0;
  });
}

export function getNextHandoverSorts(currentSorts, key, event) {
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
