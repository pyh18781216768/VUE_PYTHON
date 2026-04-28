import { normalizeText } from "./notificationFormatters";

export function storageKey(prefix, username) {
  return `${prefix}${normalizeText(username) || "anonymous"}`;
}

export function loadIdSet(key) {
  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) return new Set();
  try {
    const parsed = JSON.parse(rawValue);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveIdSet(key, ids) {
  window.localStorage.setItem(key, JSON.stringify(Array.from(ids)));
}
