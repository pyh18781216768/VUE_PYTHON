import { requestJson } from "@/api/http";

export function logOperation(pageName, actionType, recordLabel, recordId = "") {
  if (!pageName || !recordLabel) return;
  void requestJson("/api/task-system/operation-logs", {
    method: "POST",
    body: JSON.stringify({
      pageName,
      actionType,
      recordLabel,
      recordId,
    }),
  }).catch(() => {});
}
