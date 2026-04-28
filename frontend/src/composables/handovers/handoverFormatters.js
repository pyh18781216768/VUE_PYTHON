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

export function formatDateTime(value) {
  const text = normalizeText(value).replace("T", " ");
  return text ? text.slice(0, 16) : "--";
}
