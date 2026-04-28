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

    <button class="top-tool-button" type="button" @click="profileOpen = true">个人信息</button>
    <button class="top-tool-button" type="button" @click="logout">退出登录</button>

    <NotificationProfileDialog :open="profileOpen" :user="currentUser" @close="profileOpen = false" />

    <NotificationDetailStack
      :format-date-time="formatDateTime"
      :get-handover-record-label="getHandoverRecordLabel"
      :preview-file="previewFile"
      :selected-handover="selectedHandover"
      :selected-task="selectedTask"
      @close-handover="closeHandoverDetail"
      @close-preview="closePreview"
      @close-task="closeTaskDetail"
      @open-preview="openPreview"
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
import NotificationDetailStack from "./NotificationDetailStack.vue";
import NotificationPanel from "./NotificationPanel.vue";
import NotificationProfileDialog from "./NotificationProfileDialog.vue";
import NotificationTrigger from "./NotificationTrigger.vue";

const profileOpen = ref(false);

const {
  authenticated,
  clearRead,
  closeHandoverDetail,
  closePanel,
  closePreview,
  closeTaskDetail,
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
  togglePanel,
  unreadCount,
} = useNotifications();

async function logout() {
  stopActiveLoginWindowHeartbeat(true);
  await requestJson("/api/logout", { method: "POST" }).catch(() => {});
  window.location.href = "/login";
}

function handleLoginWindowConflict() {
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
