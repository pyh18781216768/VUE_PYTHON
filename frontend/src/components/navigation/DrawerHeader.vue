<template>
  <div class="drawer-heading">
    <div>
      <span class="drawer-kicker">系统目录</span>
      <strong>System Directory</strong>
    </div>
    <button class="drawer-close" type="button" @click="$emit('close')">关闭</button>
  </div>
</template>

<script setup>
defineEmits(["close"]);
</script>
