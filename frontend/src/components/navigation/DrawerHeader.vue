<template>
  <div class="drawer-heading">
    <div>
      <span class="drawer-kicker">系統目錄</span>
      <strong>System Directory</strong>
    </div>
    <button class="drawer-close" type="button" @click="$emit('close')">關閉</button>
  </div>
</template>

<script setup>
defineEmits(["close"]);
</script>
