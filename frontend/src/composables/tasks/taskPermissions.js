import { normalizeText } from "./taskFormatters";

export function createTaskPermissionHelpers({ currentUser, users, isAdmin }) {
  function getPersonIdentityValues(value) {
    const rawValue = normalizeText(value);
    if (!rawValue) return new Set();
    const values = new Set([rawValue]);
    const user = users.value.find((item) =>
      [item.username, item.displayName, item.displayLabel]
        .map((entry) => normalizeText(entry))
        .filter(Boolean)
        .includes(rawValue),
    );
    if (user) {
      for (const item of [user.username, user.displayName, user.displayLabel]) {
        const normalized = normalizeText(item);
        if (normalized) values.add(normalized);
      }
    }
    return values;
  }

  function isCurrentUserIdentity(value) {
    const currentValues = new Set(
      [currentUser.value?.username, currentUser.value?.displayName, currentUser.value?.displayLabel]
        .map((item) => normalizeText(item))
        .filter(Boolean),
    );
    for (const item of getPersonIdentityValues(value)) {
      if (currentValues.has(item)) return true;
    }
    return false;
  }

  function findUserByIdentity(value) {
    const values = getPersonIdentityValues(value);
    return (
      users.value.find((user) =>
        [user.username, user.displayName, user.displayLabel]
          .map((entry) => normalizeText(entry))
          .some((entry) => values.has(entry)),
      ) || null
    );
  }

  function isCurrentUserTaskAssignee(task) {
    return isCurrentUserIdentity(task.assigneeUserId || task.assigneeUser);
  }

  function canClaimTask(task) {
    return task.status === "未开始" && isCurrentUserTaskAssignee(task);
  }

  function canRejectTask(task) {
    return !["待审核", "已完成", "已驳回"].includes(task.status) && (isCurrentUserTaskAssignee(task) || isAdmin.value);
  }

  function canSubmitTask(task) {
    return task.status === "进行中" && isCurrentUserTaskAssignee(task);
  }

  function canReviewTask(task) {
    const submission = task.reviewSubmission || {};
    if (task.status !== "待审核" || submission.status !== "pending") return false;
    return (submission.reviewers || []).some(
      (reviewer) => !reviewer.hasReviewed && isCurrentUserIdentity(reviewer.username || reviewer.label),
    );
  }

  function canEditTask(task) {
    if (isAdmin.value) return true;
    if (isCurrentUserIdentity(task.creatorUserId || task.creatorUser)) return true;
    const creator = findUserByIdentity(task.creatorUserId || task.creatorUser);
    return creator?.supervisorUser === currentUser.value?.username;
  }

  return {
    canClaimTask,
    canEditTask,
    canRejectTask,
    canReviewTask,
    canSubmitTask,
  };
}
