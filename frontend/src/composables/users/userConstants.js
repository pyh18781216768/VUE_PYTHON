export const ROLE_OPTIONS = [
  { value: "user", label: "普通使用者" },
  { value: "line_leader", label: "線組長" },
  { value: "section_chief", label: "科長" },
  { value: "department_head", label: "部長" },
  { value: "admin", label: "超級管理員" },
];

export function createUserForm() {
  return {
    originalUsername: "",
    username: "",
    displayName: "",
    department: "",
    email: "",
    phone: "",
    role: "user",
    password: "",
  };
}

export function createPermissionForm() {
  return {
    username: "",
    displayLabel: "",
    currentRole: "user",
    role: "user",
  };
}

export function createDefaultUserSorts() {
  return [
    { key: "createdAt", direction: "desc" },
    { key: "id", direction: "desc" },
  ];
}
