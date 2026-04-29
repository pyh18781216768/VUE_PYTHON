import { computed, onBeforeUnmount, ref } from "vue";

import { fetchNotificationBootstrap, fetchSession } from "./notifications/notificationApi";
import { logOperation } from "./operationLogger";
import {
  CLEARED_STORAGE_PREFIX,
  createEmptyReminders,
  READ_STORAGE_PREFIX,
  REFRESH_INTERVAL_MS,
} from "./notifications/notificationConstants";
import { findHandoverForNotification, findTaskForNotification } from "./notifications/notificationDetails";
import { createHandoverRecordLabel, formatDateTime } from "./notifications/notificationFormatters";
import { createNotificationItems } from "./notifications/notificationItems";
import { loadIdSet, saveIdSet, storageKey } from "./notifications/notificationStorage";
import { claimTaskById, rejectTaskById, submitTaskReviewScore } from "./tasks/taskApi";
import { upsertTask } from "./tasks/taskCollection";
import { formatTaskStatusLabel, normalizeText } from "./tasks/taskFormatters";
import { createTaskPermissionHelpers } from "./tasks/taskPermissions";

export { formatDateTime, formatReminderRemaining } from "./notifications/notificationFormatters";

export function useNotifications() {
  const authenticated = ref(false);
  const currentUser = ref(null);
  const reminders = ref(createEmptyReminders());
  const handovers = ref([]);
  const tasks = ref([]);
  const users = ref([]);
  const departments = ref([]);
  const readIds = ref(new Set());
  const clearedIds = ref(new Set());
  const panelOpen = ref(false);
  const loading = ref(false);
  const actionSubmitting = ref(false);
  const actionMessage = ref("");
  const actionMessageTone = ref("success");
  const selectedHandover = ref(null);
  const selectedTask = ref(null);
  const previewFile = ref(null);
  let refreshTimer = null;

  const readStorageKey = computed(() => storageKey(READ_STORAGE_PREFIX, currentUser.value?.username));
  const clearedStorageKey = computed(() => storageKey(CLEARED_STORAGE_PREFIX, currentUser.value?.username));

  const items = computed(() => createNotificationItems(reminders.value, readIds.value, clearedIds.value));

  const unreadCount = computed(() => items.value.filter((item) => item.unread).length);
  const readCount = computed(() => items.value.filter((item) => !item.unread).length);
  const isAdmin = computed(() => Number(currentUser.value?.permissionLevel || 1) >= 5);
  const departmentOptions = computed(() => departments.value.map((item) => ({ value: item.name, label: item.name })));
  const supervisorOptions = computed(() =>
    users.value
      .filter((item) => ["line_leader", "section_chief", "department_head"].includes(item.role))
      .map((item) => ({
        value: item.username,
        label: [item.displayLabel || item.displayName || item.username, item.username, item.department]
          .filter(Boolean)
          .join(" / "),
      })),
  );
  const { canClaimTask, canRejectTask, canReviewTask } = createTaskPermissionHelpers({
    currentUser,
    users,
    isAdmin,
  });

  function syncStorageForUser() {
    readIds.value = loadIdSet(readStorageKey.value);
    clearedIds.value = loadIdSet(clearedStorageKey.value);
  }

  async function loadNotifications() {
    loading.value = true;
    try {
      const session = await fetchSession();
      authenticated.value = Boolean(session.authenticated);
      currentUser.value = session.authenticated ? session.user : null;
      if (!authenticated.value) {
        reminders.value = createEmptyReminders();
        handovers.value = [];
        tasks.value = [];
        users.value = [];
        departments.value = [];
        return;
      }
      syncStorageForUser();
      const payload = await fetchNotificationBootstrap();
      reminders.value = { ...createEmptyReminders(), ...(payload.reminders || {}) };
      handovers.value = payload.handovers || [];
      tasks.value = payload.tasks || [];
      users.value = payload.users || [];
      departments.value = payload.departments || [];
    } finally {
      loading.value = false;
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = window.setInterval(() => {
      void loadNotifications().catch(() => {});
    }, REFRESH_INTERVAL_MS);
  }

  function stopAutoRefresh() {
    if (!refreshTimer) return;
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }

  function togglePanel() {
    panelOpen.value = !panelOpen.value;
    if (panelOpen.value) void loadNotifications().catch(() => {});
  }

  function closePanel() {
    panelOpen.value = false;
  }

  function markRead(item) {
    if (!item?.id || readIds.value.has(item.id)) return;
    const nextIds = new Set(readIds.value);
    nextIds.add(item.id);
    readIds.value = nextIds;
    saveIdSet(readStorageKey.value, nextIds);
  }

  function clearRead() {
    const ids = items.value.filter((item) => !item.unread).map((item) => item.id);
    if (!ids.length) return;
    const nextIds = new Set(clearedIds.value);
    for (const id of ids) nextIds.add(id);
    clearedIds.value = nextIds;
    saveIdSet(clearedStorageKey.value, nextIds);
  }

  function openNotificationDetail(item) {
    if (!item) return;
    markRead(item);
    actionMessage.value = "";
    if (item.type === "handover") {
      selectedHandover.value = findHandoverForNotification(item, handovers.value);
      logOperation(
        "通知提醒",
        "查看",
        notificationDetailLabel("交接班詳情", selectedHandover.value, item),
        selectedHandover.value?.id || item.handoverRecordId,
      );
      return;
    }
    if (item.type === "task") {
      selectedTask.value = findTaskForNotification(item, tasks.value);
      logOperation(
        "通知提醒",
        "查看",
        notificationDetailLabel("任務詳情", selectedTask.value, item),
        selectedTask.value?.id || item.taskId,
      );
    }
  }

  function closeHandoverDetail() {
    selectedHandover.value = null;
  }

  function closeTaskDetail() {
    selectedTask.value = null;
    actionMessage.value = "";
  }

  function openPreview(file) {
    previewFile.value = file;
  }

  function closePreview() {
    previewFile.value = null;
  }

  function getHandoverRecordLabel(recordId) {
    return createHandoverRecordLabel(recordId, handovers.value, formatDateTime);
  }

  function updateCurrentUser(user) {
    if (!user) return;
    currentUser.value = user;
  }

  function notificationDetailLabel(prefix, detail, item) {
    return [
      prefix,
      detail?.id ? `#${detail.id}` : "",
      detail?.title || detail?.keywords || item?.title,
    ]
      .filter(Boolean)
      .join(" / ");
  }

  function showActionMessage(nextMessage, tone = "success") {
    actionMessage.value = nextMessage;
    actionMessageTone.value = tone;
    window.clearTimeout(showActionMessage.timer);
    if (nextMessage) {
      showActionMessage.timer = window.setTimeout(() => {
        actionMessage.value = "";
      }, 3000);
    }
  }

  async function syncTaskAfterAction(task) {
    if (!task?.id) return;
    upsertTask(tasks, task);
    selectedTask.value = task;
    await loadNotifications().catch(() => {});
    selectedTask.value = tasks.value.find((item) => Number(item.id) === Number(task.id)) || task;
  }

  async function claimNotificationTask(task) {
    if (!task?.id) return false;
    actionSubmitting.value = true;
    try {
      const payload = await claimTaskById(task.id);
      await syncTaskAfterAction(payload.item);
      showActionMessage("任務已領取。");
      return true;
    } catch (error) {
      showActionMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      actionSubmitting.value = false;
    }
  }

  async function rejectNotificationTask({ task, reason }) {
    if (!task?.id) return false;
    const rejectReason = normalizeText(reason);
    if (!rejectReason) {
      showActionMessage("請輸入駁回理由。", "error");
      return false;
    }
    actionSubmitting.value = true;
    try {
      const payload = await rejectTaskById(task.id, rejectReason);
      await syncTaskAfterAction(payload.item);
      showActionMessage("任務已駁回。");
      return true;
    } catch (error) {
      showActionMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      actionSubmitting.value = false;
    }
  }

  async function reviewNotificationTask({ task, score, comment }) {
    if (!task?.id) return false;
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
      showActionMessage("評分必須在 0-100 之間。", "error");
      return false;
    }
    actionSubmitting.value = true;
    try {
      const payload = await submitTaskReviewScore(task.id, numericScore, comment);
      await syncTaskAfterAction(payload.item);
      showActionMessage("評分已提交。");
      return true;
    } catch (error) {
      showActionMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      actionSubmitting.value = false;
    }
  }

  onBeforeUnmount(stopAutoRefresh);

  return {
    actionMessage,
    actionMessageTone,
    actionSubmitting,
    authenticated,
    canClaimTask,
    canRejectTask,
    canReviewTask,
    claimNotificationTask,
    closeHandoverDetail,
    closePanel,
    closePreview,
    closeTaskDetail,
    clearRead,
    currentUser,
    departmentOptions,
    formatDateTime,
    formatTaskStatusLabel,
    getHandoverRecordLabel,
    items,
    loading,
    loadNotifications,
    openNotificationDetail,
    openPreview,
    panelOpen,
    previewFile,
    readCount,
    selectedHandover,
    selectedTask,
    startAutoRefresh,
    stopAutoRefresh,
    rejectNotificationTask,
    reviewNotificationTask,
    supervisorOptions,
    togglePanel,
    updateCurrentUser,
    unreadCount,
  };
}
