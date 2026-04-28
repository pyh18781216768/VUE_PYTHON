import { createRejectForm, createReviewForm, createSubmitForm, createTaskForm } from "./taskConstants";
import { normalizeText, toDateTimeLocal } from "./taskFormatters";

export function resetReactiveObject(target, nextValue) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, typeof nextValue === "function" ? nextValue() : nextValue);
}

export function resetTaskForm(form) {
  resetReactiveObject(form, createTaskForm);
}

export function fillTaskFormFromTask(form, task) {
  resetTaskForm(form);
  Object.assign(form, {
    id: String(task.id || ""),
    title: task.title || "",
    description: task.description || "",
    status: task.status || "未开始",
    priority: task.priority || "中",
    startAt: toDateTimeLocal(task.startAt),
    dueAt: toDateTimeLocal(task.dueAt),
    assigneeUser: task.assigneeUserId || "",
    handoverRecordId: task.handoverRecordId ? String(task.handoverRecordId) : "",
    mentionUsers: Array.isArray(task.mentionUsers) ? [...task.mentionUsers] : [],
  });
}

export function validateTaskForm(form) {
  if (!normalizeText(form.title)) return "請輸入任務標題。";
  if (form.startAt && form.dueAt) {
    const startTime = new Date(form.startAt).getTime();
    const dueTime = new Date(form.dueAt).getTime();
    if (Number.isFinite(startTime) && Number.isFinite(dueTime) && dueTime < startTime) {
      return "到期時間不能早於開始時間。";
    }
  }
  return "";
}

export function fillRejectForm(form, task) {
  form.taskId = String(task.id || "");
  form.title = task.title || "";
  form.reason = "";
}

export function clearRejectForm(form) {
  resetReactiveObject(form, createRejectForm);
}

export function fillSubmitForm(form, task) {
  form.taskId = String(task.id || "");
  form.title = task.title || "";
  form.content = "";
}

export function clearSubmitForm(form) {
  resetReactiveObject(form, createSubmitForm);
}

export function fillReviewForm(form, task) {
  form.taskId = String(task.id || "");
  form.title = task.title || "";
  form.score = "";
  form.comment = "";
}

export function clearReviewForm(form) {
  resetReactiveObject(form, createReviewForm);
}

export function selectedFilesFromEvent(event) {
  return Array.from(event.target.files || []);
}
