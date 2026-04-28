import { postDownload } from "@/api/download";
import { requestFormData, requestJson } from "@/api/http";

export async function loadTaskLookups() {
  const [sessionPayload, bootstrapPayload] = await Promise.all([
    requestJson("/api/session"),
    requestJson("/api/task-system/bootstrap"),
  ]);
  return { sessionPayload, bootstrapPayload };
}

export async function fetchTaskRows(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestJson(`/api/task-system/tasks${suffix}`);
}

export function saveTask(form, files) {
  return requestFormData(
    "/api/task-system/tasks",
    {
      ...form,
      handoverRecordId: form.handoverRecordId || null,
    },
    files,
  );
}

export function deleteTaskById(taskId) {
  return requestJson(`/api/task-system/tasks/${taskId}`, { method: "DELETE" });
}

export function claimTaskById(taskId) {
  return requestJson(`/api/task-system/tasks/${taskId}/claim`, { method: "POST" });
}

export function rejectTaskById(taskId, reason) {
  return requestJson(`/api/task-system/tasks/${taskId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function submitTaskForReview(taskId, content, files) {
  return requestFormData(`/api/task-system/tasks/${taskId}/submit`, { content }, files);
}

export function submitTaskReviewScore(taskId, score, comment) {
  return requestJson(`/api/task-system/tasks/${taskId}/review`, {
    method: "POST",
    body: JSON.stringify({ score, comment }),
  });
}

export function exportTaskRows(filters) {
  return postDownload(
    "/api/task-system/export",
    { type: "task", format: "excel", filters },
    "task_records.xlsx",
  );
}
