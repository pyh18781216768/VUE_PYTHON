<template>
  <ModalDialog :open="Boolean(file)" :title="file?.originalName || '附件預覽'" eyebrow="Preview" @close="$emit('close')">
    <div class="attachment-preview-body">
      <img v-if="file" :src="file.previewUrl || file.downloadUrl" :alt="file.originalName" />
      <a v-if="file" class="primary-link" :href="file.downloadUrl" download>下載原圖</a>
    </div>
  </ModalDialog>
</template>

<script setup>
import ModalDialog from "@/components/ModalDialog.vue";

defineEmits(["close"]);

defineProps({
  file: { type: Object, default: null },
});
</script>
