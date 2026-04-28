import { getClientInstanceId } from "@/api/http";

const ACTIVE_LOGIN_WINDOW_STORAGE_PREFIX = "fab_active_login_window_";
const ACTIVE_LOGIN_WINDOW_HEARTBEAT_MS = 5000;
const ACTIVE_LOGIN_WINDOW_STALE_MS = 15000;
const WINDOW_INSTANCE_STORAGE_KEY = "fab_window_instance_id";

let activeLoginWindowUsername = "";
let heartbeatTimer = null;
let pageHideInstalled = false;

function createInstanceId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStorageValue(storage, key) {
  try {
    return storage?.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeStorageValue(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Storage can be disabled in locked-down browsers.
  }
}

function removeStorageValue(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function getWindowInstanceId() {
  const existingId = readStorageValue(window.sessionStorage, WINDOW_INSTANCE_STORAGE_KEY);
  if (existingId) return existingId;
  const windowId = createInstanceId();
  writeStorageValue(window.sessionStorage, WINDOW_INSTANCE_STORAGE_KEY, windowId);
  return windowId;
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function getActiveLoginWindowStorageKey(username) {
  return `${ACTIVE_LOGIN_WINDOW_STORAGE_PREFIX}${encodeURIComponent(normalizeUsername(username))}`;
}

function readActiveLoginWindow(username) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return null;
  const rawValue = readStorageValue(window.localStorage, getActiveLoginWindowStorageKey(normalizedUsername));
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue);
  } catch {
    removeStorageValue(window.localStorage, getActiveLoginWindowStorageKey(normalizedUsername));
    return null;
  }
}

function isActiveLoginWindowFresh(record) {
  const updatedAt = Number(record?.updatedAt || 0);
  return Boolean(updatedAt && Date.now() - updatedAt <= ACTIVE_LOGIN_WINDOW_STALE_MS);
}

function writeActiveLoginWindow(username) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return;
  writeStorageValue(
    window.localStorage,
    getActiveLoginWindowStorageKey(normalizedUsername),
    JSON.stringify({
      browserId: getClientInstanceId(),
      windowId: getWindowInstanceId(),
      updatedAt: Date.now(),
    }),
  );
}

export function isOtherActiveLoginWindow(username) {
  const record = readActiveLoginWindow(username);
  return Boolean(record && isActiveLoginWindowFresh(record) && record.windowId !== getWindowInstanceId());
}

export function releaseActiveLoginWindow(username) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return;
  const record = readActiveLoginWindow(normalizedUsername);
  if (!record || record.windowId === getWindowInstanceId()) {
    removeStorageValue(window.localStorage, getActiveLoginWindowStorageKey(normalizedUsername));
  }
}

export function stopActiveLoginWindowHeartbeat(releaseCurrent = true) {
  const username = activeLoginWindowUsername;
  if (heartbeatTimer) {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  activeLoginWindowUsername = "";
  if (releaseCurrent && username) releaseActiveLoginWindow(username);
}

export function startActiveLoginWindowHeartbeat(username, onConflict) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return true;
  if (isOtherActiveLoginWindow(normalizedUsername)) return false;

  if (activeLoginWindowUsername && activeLoginWindowUsername !== normalizedUsername) {
    releaseActiveLoginWindow(activeLoginWindowUsername);
  }
  activeLoginWindowUsername = normalizedUsername;
  writeActiveLoginWindow(normalizedUsername);

  if (heartbeatTimer) window.clearInterval(heartbeatTimer);
  heartbeatTimer = window.setInterval(() => {
    if (isOtherActiveLoginWindow(normalizedUsername)) {
      stopActiveLoginWindowHeartbeat(false);
      if (typeof onConflict === "function") onConflict();
      return;
    }
    writeActiveLoginWindow(normalizedUsername);
  }, ACTIVE_LOGIN_WINDOW_HEARTBEAT_MS);

  installActiveLoginWindowCleanup();
  return true;
}

export function installActiveLoginWindowCleanup() {
  if (pageHideInstalled) return;
  pageHideInstalled = true;
  window.addEventListener("pagehide", () => stopActiveLoginWindowHeartbeat(true));
}
