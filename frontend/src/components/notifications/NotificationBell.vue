<template>
  <div v-if="authenticated" class="frontend-top-tools">
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
import { onMounted, ref, watch } from "vue";

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
  await loadNotifications().catch(() => {});
  startAutoRefresh();
});

watch(
  () => currentUser.value?.username,
  (username) => {
    if (username) startActiveLoginWindowHeartbeat(username, handleLoginWindowConflict);
  },
  { immediate: true },
);
</script>
