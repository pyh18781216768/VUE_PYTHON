const CLIENT_INSTANCE_STORAGE_KEY = "fab_client_instance_id";

function createClientInstanceId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getClientInstanceId() {
  const existing = window.localStorage.getItem(CLIENT_INSTANCE_STORAGE_KEY);
  if (existing) return existing;
  const clientId = createClientInstanceId();
  window.localStorage.setItem(CLIENT_INSTANCE_STORAGE_KEY, clientId);
  return clientId;
}

export function getClientInstanceHeaders() {
  return { "X-Client-Instance": getClientInstanceId() };
}

export async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...getClientInstanceHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "请求失败。");
  }
  return payload;
}

export async function requestFormData(url, payload, files = [], options = {}) {
  const formData = new FormData();
  formData.append("payload", JSON.stringify(payload));
  for (const file of files) formData.append("attachments", file);

  const response = await fetch(url, {
    method: options.method || "POST",
    credentials: "same-origin",
    headers: {
      ...getClientInstanceHeaders(),
      ...(options.headers || {}),
    },
    body: formData,
  });

  const responsePayload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(responsePayload.message || "请求失败。");
  }
  return responsePayload;
}
