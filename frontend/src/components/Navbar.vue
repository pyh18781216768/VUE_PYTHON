<template>
  <DrawerToggle :controls="drawerId" :open="drawerOpen" @open="openDrawer" />

  <div v-if="drawerOpen" class="frontend-drawer-backdrop" @click="closeDrawer"></div>

  <aside :id="drawerId" class="app-navbar" :class="{ open: drawerOpen }" aria-label="系统目录">
    <DrawerHeader @close="closeDrawer" />
    <SystemSwitch v-model="selectedSystem" />
    <NavLinks :external-items="externalNavItems" :route-items="routeNavItems" @navigate="closeDrawer" />
    <NavUserCard :user="userInfo" @navigate="closeDrawer" />
  </aside>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { requestJson } from "@/api/http";
import DrawerHeader from "@/components/navigation/DrawerHeader.vue";
import DrawerToggle from "@/components/navigation/DrawerToggle.vue";
import NavLinks from "@/components/navigation/NavLinks.vue";
import NavUserCard from "@/components/navigation/NavUserCard.vue";
import SystemSwitch from "@/components/navigation/SystemSwitch.vue";

const drawerId = "frontend-system-directory";
const currentUser = ref(null);
const drawerOpen = ref(false);
const route = useRoute();
const selectedSystem = ref(getSystemFromPath(window.location.pathname));

const navItems = computed(() => {
  if (selectedSystem.value === "dashboard") {
    return [
      { kicker: "OC", label: "OC 参数", to: "/oc" },
      { kicker: "ANGLE", label: "Angle 参数", to: "/angle" },
      { kicker: "LENS", label: "Lens 参数", to: "/lens" },
    ];
  }

  const items = [
    { kicker: "HANDOVER", label: "交接班记录", to: "/frontend/handover" },
    { kicker: "TASKS", label: "任务清单", to: "/frontend/tasks" },
  ];
  if (Number(currentUser.value?.permissionLevel || 1) >= 5) {
    items.push({ kicker: "USERS", label: "使用者管理", to: "/frontend/users" });
    items.push({ kicker: "LOGS", label: "操作记录", to: "/frontend/operations" });
    items.push({ kicker: "SETTINGS", label: "设置", to: "/frontend/settings" });
  }
  return items;
});

const externalNavItems = computed(() => navItems.value.filter((item) => item.external));
const routeNavItems = computed(() => navItems.value.filter((item) => !item.external));

const userInfo = computed(() => {
  const user = currentUser.value || {};
  return {
    username: user.username || "--",
    displayName: user.displayLabel || user.displayName || "--",
    department: user.department || "--",
  };
});

function getSystemFromPath(path) {
  return ["/oc", "/angle", "/lens", "/frontend/dashboard"].includes(path) ? "dashboard" : "tasks";
}

function openDrawer() {
  selectedSystem.value = getSystemFromPath(route.path);
  drawerOpen.value = true;
}

function closeDrawer() {
  drawerOpen.value = false;
}

watch(
  () => route.path,
  (path) => {
    if (!drawerOpen.value) selectedSystem.value = getSystemFromPath(path);
  },
);

onMounted(async () => {
  try {
    const session = await requestJson("/api/session");
    currentUser.value = session.authenticated ? session.user : null;
  } catch {
    currentUser.value = null;
  }
});
</script>
