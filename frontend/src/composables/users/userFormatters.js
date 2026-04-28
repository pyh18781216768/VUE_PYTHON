import { ROLE_OPTIONS } from "./userConstants";

export function normalizeText(value) {
  return String(value ?? "").trim();
}

export function normalizeComparable(value) {
  return normalizeText(value).toLowerCase();
}

export function getRoleLabel(role) {
  return ROLE_OPTIONS.find((item) => item.value === role)?.label || "普通使用者";
}

export function formatDateTime(value) {
  const text = normalizeText(value).replace("T", " ");
  return text ? text.slice(0, 16) : "--";
}
