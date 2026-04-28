export const DEFAULT_STATUS_OPTIONS = ["未开始", "进行中", "待审核", "已完成", "已驳回"];
export const DEFAULT_PRIORITY_OPTIONS = ["低", "中", "高"];
export const TASK_FORM_HIDDEN_STATUSES = new Set(["待审核", "已驳回"]);

export function createTaskForm() {
  return {
    id: "",
    title: "",
    description: "",
    status: "未开始",
    priority: "中",
    startAt: "",
    dueAt: "",
    assigneeUser: "",
    handoverRecordId: "",
    mentionUsers: [],
  };
}

export function createRejectForm() {
  return { taskId: "", title: "", reason: "" };
}

export function createSubmitForm() {
  return { taskId: "", title: "", content: "" };
}

export function createReviewForm() {
  return { taskId: "", title: "", score: "", comment: "" };
}

export function createDefaultTaskSorts() {
  return [
    { key: "createdAt", direction: "desc" },
    { key: "id", direction: "desc" },
  ];
}
