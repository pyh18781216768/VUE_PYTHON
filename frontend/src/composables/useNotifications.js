import { computed, onBeforeUnmount, ref } from "vue";

import { fetchNotificationBootstrap, fetchSession } from "./notifications/notificationApi";
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

export { formatDateTime, formatReminderRemaining } from "./notifications/notificationFormatters";

export function useNotifications() {
  const authenticated = ref(false);
  const currentUser = ref(null);
  const reminders = ref(createEmptyReminders());
  const handovers = ref([]);
  const tasks = ref([]);
  const readIds = ref(new Set());
  const clearedIds = ref(new Set());
  const panelOpen = ref(false);
  const loading = ref(false);
  const selectedHandover = ref(null);
  const selectedTask = ref(null);
  const previewFile = ref(null);
  let refreshTimer = null;

  const readStorageKey = computed(() => storageKey(READ_STORAGE_PREFIX, currentUser.value?.username));
  const clearedStorageKey = computed(() => storageKey(CLEARED_STORAGE_PREFIX, currentUser.value?.username));

  const items = computed(() => createNotificationItems(reminders.value, readIds.value, clearedIds.value));

  const unreadCount = computed(() => items.value.filter((item) => item.unread).length);
  const readCount = computed(() => items.value.filter((item) => !item.unread).length);

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
        return;
      }
      syncStorageForUser();
      const payload = await fetchNotificationBootstrap();
      reminders.value = { ...createEmptyReminders(), ...(payload.reminders || {}) };
      handovers.value = payload.handovers || [];
      tasks.value = payload.tasks || [];
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
    if (item.type === "handover") {
      selectedHandover.value = findHandoverForNotification(item, handovers.value);
      return;
    }
    if (item.type === "task") {
      selectedTask.value = findTaskForNotification(item, tasks.value);
    }
  }

  function closeHandoverDetail() {
    selectedHandover.value = null;
  }

  function closeTaskDetail() {
    selectedTask.value = null;
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

  onBeforeUnmount(stopAutoRefresh);

  return {
    authenticated,
    closeHandoverDetail,
    closePanel,
    closePreview,
    closeTaskDetail,
    clearRead,
    currentUser,
    formatDateTime,
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
    togglePanel,
    unreadCount,
  };
}
