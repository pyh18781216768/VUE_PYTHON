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
      @click.prevent="navigateTo(item.to)"
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

function isActive(path) {
  return route.path === path;
}

async function navigateTo(path) {
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
