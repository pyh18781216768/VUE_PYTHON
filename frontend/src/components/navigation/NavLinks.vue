<template>
  <nav class="app-nav-links" aria-label="前端工程導航">
    <a v-for="item in externalItems" :key="item.to" :href="item.to" @click="$emit('navigate')">
      <span>{{ item.kicker }}</span>
      <strong>{{ item.label }}</strong>
    </a>
    <a
      v-for="item in routeItems"
      :key="item.to"
      :class="{ 'router-link-active': isActive(item.to) }"
      :href="item.to"
      @click="navigateTo($event, item.to)"
    >
      <span>{{ item.kicker }}</span>
      <strong>{{ item.label }}</strong>
    </a>
  </nav>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";

const emit = defineEmits(["navigate"]);

defineProps({
  externalItems: { type: Array, default: () => [] },
  routeItems: { type: Array, default: () => [] },
});

const route = useRoute();
const router = useRouter();
const directNavigationPaths = new Set(["/oc", "/angle", "/lens"]);

function isActive(path) {
  return route.path === path;
}

async function navigateTo(event, path) {
  if (directNavigationPaths.has(path)) {
    event.preventDefault();
    emit("navigate");
    if (route.path !== path) window.location.assign(path);
    return;
  }

  event.preventDefault();
  try {
    await router.push(path);
    if (router.currentRoute.value.path !== path) {
      window.location.assign(path);
      return;
    }
    emit("navigate");
  } catch {
    window.location.assign(path);
  }
}
</script>
