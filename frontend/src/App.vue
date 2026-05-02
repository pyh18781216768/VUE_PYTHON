<template>
  <router-view v-if="$route.meta.standalone" />
  <div v-else class="frontend-shell">
    <Navbar />
    <ManufacturingHeader />
    <NotificationBell />
    <main class="frontend-main" :class="{ 'frontend-main-dashboard': $route.meta.dashboardHome }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import ManufacturingHeader from "@/components/dashboard/ManufacturingHeader.vue";
import Navbar from "@/components/Navbar.vue";
import NotificationBell from "@/components/notifications/NotificationBell.vue";
</script>
