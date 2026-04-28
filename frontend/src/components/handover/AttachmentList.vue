<template>
  <div v-if="attachments.length" class="attachment-list">
    <div v-for="file in attachments" :key="file.id" class="attachment-item">
      <button
        v-if="isImageAttachment(file)"
        class="attachment-image-button"
        type="button"
        :title="`點擊放大：${file.originalName}`"
        @click="$emit('preview', file)"
      >
        <img :src="file.previewUrl || file.downloadUrl" :alt="file.originalName" />
      </button>
      <span v-else class="attachment-file-name">{{ file.originalName }}</span>
      <a class="attachment-download-link" :href="file.downloadUrl" download>下載</a>
    </div>
  </div>
  <span v-else class="subtle-text">--</span>
</template>

<script setup>
defineEmits(["preview"]);

defineProps({
  attachments: { type: Array, default: () => [] },
});

function isImageAttachment(file) {
  const contentType = String(file?.contentType || "").toLowerCase();
  if (contentType.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(String(file?.originalName || ""));
}
</script>
