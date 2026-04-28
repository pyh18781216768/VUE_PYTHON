<template>
  <button
    class="notification-bell"
    type="button"
    :class="{ active, 'has-unread': unreadCount > 0 }"
    aria-label="通知提醒"
    @click="$emit('toggle')"
  >
    <span class="notification-bell-icon">🔔</span>
    <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
  </button>
</template>

<script setup>
defineEmits(["toggle"]);

defineProps({
  active: { type: Boolean, default: false },
  unreadCount: { type: Number, default: 0 },
});
</script>
