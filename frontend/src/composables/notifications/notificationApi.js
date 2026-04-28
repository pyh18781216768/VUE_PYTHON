import { requestJson } from "@/api/http";

export function fetchSession() {
  return requestJson("/api/session");
}

export function fetchNotificationBootstrap() {
  return requestJson("/api/task-system/bootstrap");
}
