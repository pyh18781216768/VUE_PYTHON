<template>
  <section v-if="open" class="notification-panel">
    <div class="notification-panel-head">
      <strong>通知提醒</strong>
      <div class="notification-panel-actions">
        <small>{{ unreadCount > 0 ? `未讀 ${unreadCount} 筆` : "暫無未讀" }}</small>
        <button class="notification-mini-button" type="button" :disabled="readCount === 0" @click="$emit('clear-read')">
          清除已讀
        </button>
        <button class="notification-mini-button" type="button" @click="$emit('close')">關閉</button>
      </div>
    </div>

    <div v-if="loading && !items.length" class="notification-empty">正在載入提醒...</div>
    <div v-else-if="!items.length" class="notification-empty">目前沒有提醒。</div>
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      :class="['notification-item', item.category ? `notification-kind-${item.category}` : '', { unread: item.unread }]"
      title="單擊查看詳情並標記已讀"
      @click="$emit('open-detail', item)"
    >
      <span class="notification-type">{{ item.typeLabel }}</span>
      <strong>{{ item.title }}</strong>
      <small>{{ item.description }}</small>
    </button>
  </section>
</template>

<script setup>
defineEmits(["clear-read", "close", "open-detail"]);

defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  open: { type: Boolean, default: false },
  readCount: { type: Number, default: 0 },
  unreadCount: { type: Number, default: 0 },
});
</script>
