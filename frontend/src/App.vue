<template>
  <router-view v-if="$route.meta.standalone" />
  <div v-else class="frontend-shell">
    <Navbar />
    <NotificationBell />
    <main class="frontend-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Navbar from "@/components/Navbar.vue";
import NotificationBell from "@/components/notifications/NotificationBell.vue";
</script>
