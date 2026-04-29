<template>
  <button
    class="frontend-drawer-toggle"
    type="button"
    :aria-expanded="open"
    :aria-controls="controls"
    @click="$emit('open')"
  >
    目錄
  </button>
</template>

<script setup>
defineEmits(["open"]);

defineProps({
  controls: { type: String, required: true },
  open: { type: Boolean, default: false },
});
</script>
