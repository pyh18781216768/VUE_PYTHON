<template>
  <section v-if="open" class="notification-panel">
    <div class="notification-panel-head">
      <strong>通知提醒</strong>
      <div class="notification-panel-actions">
        <small>{{ unreadCount > 0 ? `未读 ${unreadCount} 条` : "暂无未读" }}</small>
        <button class="notification-mini-button" type="button" :disabled="readCount === 0" @click="$emit('clear-read')">
          清除已读
        </button>
        <button class="notification-mini-button" type="button" @click="$emit('close')">关闭</button>
      </div>
    </div>

    <div v-if="loading && !items.length" class="notification-empty">正在加载提醒...</div>
    <div v-else-if="!items.length" class="notification-empty">目前没有提醒。</div>
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      :class="['notification-item', item.category ? `notification-kind-${item.category}` : '', { unread: item.unread }]"
      title="单击查看详情并标记已读"
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
