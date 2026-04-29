<template>
  <div class="app-navbar-user">
    <div class="app-navbar-user-card">
      <span>工號：{{ user.username }}</span>
      <span>姓名：{{ user.displayName }}</span>
      <span>部門：{{ user.department }}</span>
    </div>
    <a class="ghost-button" href="/login" @click="$emit('navigate')">登入頁</a>
  </div>
</template>

<script setup>
defineEmits(["navigate"]);

defineProps({
  user: { type: Object, required: true },
});
</script>
