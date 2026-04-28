import { postDownload } from "@/api/download";
import { requestFormData, requestJson } from "@/api/http";

export async function loadHandoverLookups() {
  const [sessionPayload, shiftPayload, floorPayload, userPayload] = await Promise.all([
    requestJson("/api/session"),
    requestJson("/api/task-system/shifts"),
    requestJson("/api/task-system/floors"),
    requestJson("/api/task-system/users"),
  ]);
  return { floorPayload, sessionPayload, shiftPayload, userPayload };
}

export async function fetchHandoverRows(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestJson(`/api/task-system/handover-records${suffix}`);
}

export function saveHandoverRecord(form, files) {
  return requestFormData(
    "/api/task-system/handover-records",
    {
      ...form,
      shiftGroupId: form.shiftGroupId || null,
      floorId: form.floorId || null,
    },
    files,
  );
}

export function deleteHandoverRecordById(recordId) {
  return requestJson(`/api/task-system/handover-records/${recordId}`, { method: "DELETE" });
}

export function exportHandoverRows(filters) {
  return postDownload(
    "/api/task-system/export",
    { type: "handover", format: "excel", filters },
    "handover_records.xlsx",
  );
}
