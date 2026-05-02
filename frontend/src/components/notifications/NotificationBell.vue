<template>
  <div v-if="authenticated" class="frontend-top-tools">
    <div class="top-time-display" aria-label="系統時間">
      <i aria-hidden="true"></i>
      <span>{{ currentDateText }}</span>
      <strong>{{ currentClockText }}</strong>
    </div>

    <div class="notification-anchor">
      <NotificationTrigger :active="panelOpen" :unread-count="unreadCount" @toggle="togglePanel" />
      <NotificationPanel
        :items="items"
        :loading="loading"
        :open="panelOpen"
        :read-count="readCount"
        :unread-count="unreadCount"
        @clear-read="clearRead"
        @close="closePanel"
        @open-detail="openNotificationDetail"
      />
    </div>

    <button class="top-tool-button" type="button" @click="profileOpen = true">個人資訊</button>
    <button class="top-tool-button" type="button" @click="logout">登出</button>

    <NotificationProfileDialog
      :department-options="departmentOptions"
      :open="profileOpen"
      :supervisor-options="supervisorOptions"
      :user="currentUser"
      @close="profileOpen = false"
      @saved="handleProfileSaved"
    />

    <NotificationDetailStack
      :action-message="actionMessage"
      :action-message-tone="actionMessageTone"
      :action-submitting="actionSubmitting"
      :can-claim-task="canClaimTask"
      :can-reject-task="canRejectTask"
      :can-review-task="canReviewTask"
      :format-date-time="formatDateTime"
      :format-task-status-label="formatTaskStatusLabel"
      :get-handover-record-label="getHandoverRecordLabel"
      :preview-file="previewFile"
      :selected-handover="selectedHandover"
      :selected-task="selectedTask"
      @claim-task="claimNotificationTask"
      @close-handover="closeHandoverDetail"
      @close-preview="closePreview"
      @close-task="closeTaskDetail"
      @open-preview="openPreview"
      @reject-task="rejectNotificationTask"
      @review-task="reviewNotificationTask"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

import { requestJson } from "@/api/http";
import {
  startActiveLoginWindowHeartbeat,
  stopActiveLoginWindowHeartbeat,
} from "@/composables/auth/loginWindowRegistry";
import { useNotifications } from "@/composables/useNotifications";
import { clearAuthenticatedSession, setAuthenticatedSession } from "@/router";
import NotificationDetailStack from "./NotificationDetailStack.vue";
import NotificationPanel from "./NotificationPanel.vue";
import NotificationProfileDialog from "./NotificationProfileDialog.vue";
import NotificationTrigger from "./NotificationTrigger.vue";

const profileOpen = ref(false);
const now = ref(new Date());
let clockTimer = null;

const {
  actionMessage,
  actionMessageTone,
  actionSubmitting,
  authenticated,
  canClaimTask,
  canRejectTask,
  canReviewTask,
  claimNotificationTask,
  clearRead,
  closeHandoverDetail,
  closePanel,
  closePreview,
  closeTaskDetail,
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
  rejectNotificationTask,
  reviewNotificationTask,
  selectedHandover,
  selectedTask,
  startAutoRefresh,
  supervisorOptions,
  togglePanel,
  updateCurrentUser,
  unreadCount,
} = useNotifications();

const currentDateText = computed(() =>
  new Intl.DateTimeFormat("zh-Hant-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(now.value),
);

const currentClockText = computed(() =>
  new Intl.DateTimeFormat("zh-Hant-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now.value),
);

function handleProfileSaved(user) {
  updateCurrentUser(user);
  setAuthenticatedSession(user);
  window.dispatchEvent(new CustomEvent("profile-updated", { detail: user }));
}

async function logout() {
  stopActiveLoginWindowHeartbeat(true);
  clearAuthenticatedSession();
  await requestJson("/api/logout", { method: "POST" }).catch(() => {});
  window.location.href = "/login";
}

function handleLoginWindowConflict() {
  clearAuthenticatedSession();
  void requestJson("/api/logout", { method: "POST" }).catch(() => {});
  window.location.href = "/login";
}

onMounted(async () => {
  clockTimer = window.setInterval(() => {
    now.value = new Date();
  }, 1000);
  await loadNotifications().catch(() => {});
  startAutoRefresh();
});

onUnmounted(() => {
  if (clockTimer) window.clearInterval(clockTimer);
});

watch(
  () => currentUser.value?.username,
  (username) => {
    if (username) startActiveLoginWindowHeartbeat(username, handleLoginWindowConflict);
  },
  { immediate: true },
);
</script>
