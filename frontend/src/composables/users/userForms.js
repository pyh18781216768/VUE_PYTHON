import { createPermissionForm, createUserForm } from "./userConstants";
import { normalizeText } from "./userFormatters";

export function resetReactiveObject(target, nextValue) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, typeof nextValue === "function" ? nextValue() : nextValue);
}

export function resetUserForm(form) {
  resetReactiveObject(form, createUserForm);
}

export function fillUserFormFromUser(form, user) {
  resetUserForm(form);
  Object.assign(form, {
    originalUsername: user.username || "",
    username: user.username || "",
    displayName: user.displayName || "",
    department: user.department || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "user",
    password: "",
  });
}

export function resetPermissionForm(form) {
  resetReactiveObject(form, createPermissionForm);
}

export function fillPermissionFormFromUser(form, user) {
  resetPermissionForm(form);
  Object.assign(form, {
    username: user.username || "",
    displayLabel: user.displayLabel || user.displayName || user.username || "",
    currentRole: user.role || "user",
    role: user.role || "user",
  });
}

export function validateUserForm(form, isEditing) {
  if (!normalizeText(form.username)) return "請輸入工號。";
  if (!normalizeText(form.displayName)) return "請輸入姓名。";
  if (!isEditing && !normalizeText(form.password)) return "新增使用者時必須設定密碼。";
  return "";
}
