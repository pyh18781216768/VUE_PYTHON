import { createHandoverForm } from "./handoverConstants";

export function resetHandoverForm(form, currentUser) {
  for (const key of Object.keys(form)) delete form[key];
  Object.assign(form, createHandoverForm(), {
    handoverUser: currentUser?.username || "",
  });
}

export function fillHandoverFormFromRecord(form, record, currentUser) {
  resetHandoverForm(form, currentUser);
  Object.assign(form, {
    id: String(record.id || ""),
    title: record.title || "",
    shiftGroupId: String(record.shiftGroupId || ""),
    floorId: String(record.floorId || ""),
    handoverUser: record.handoverUserId || currentUser?.username || "",
    receiverUser: record.receiverUserId || "",
    workSummary: record.workSummary || "",
    precautions: record.precautions || "",
    pendingItems: record.pendingItems || "",
    keywords: record.keywords || "",
    mentionUsers: Array.isArray(record.mentionUsers) ? [...record.mentionUsers] : [],
  });
}

export function validateHandoverForm(form) {
  if (!form.shiftGroupId) return "請選擇班次。";
  if (!form.floorId) return "請選擇樓層。";
  if (!form.receiverUser) return "請選擇接班人。";
  return "";
}

export function selectedFilesFromEvent(event) {
  return Array.from(event.target.files || []);
}
