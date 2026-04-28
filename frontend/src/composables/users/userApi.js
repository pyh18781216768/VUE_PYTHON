import { requestJson } from "@/api/http";

export async function loadUserLookups() {
  const [sessionPayload, userPayload, departmentPayload] = await Promise.all([
    requestJson("/api/session"),
    requestJson("/api/task-system/users"),
    requestJson("/api/task-system/departments"),
  ]);
  return { departmentPayload, sessionPayload, userPayload };
}

export function saveUser(form) {
  return requestJson("/api/task-system/users", {
    method: "POST",
    body: JSON.stringify({ ...form }),
  });
}

export function saveUserPermission(username, role) {
  return requestJson(`/api/task-system/users/${encodeURIComponent(username)}/permission`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export function deleteUserByUsername(username) {
  return requestJson(`/api/task-system/users/${encodeURIComponent(username)}`, { method: "DELETE" });
}
