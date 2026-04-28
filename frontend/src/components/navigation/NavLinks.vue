<template>
  <nav class="app-nav-links" aria-label="前端工程导航">
    <a v-for="item in externalItems" :key="item.to" :href="item.to" @click="$emit('navigate')">
      <span>{{ item.kicker }}</span>
      <strong>{{ item.label }}</strong>
    </a>
    <RouterLink v-for="item in routeItems" :key="item.to" :to="item.to" @click="$emit('navigate')">
      <span>{{ item.kicker }}</span>
      <strong>{{ item.label }}</strong>
    </RouterLink>
  </nav>
</template>

<script setup>
defineEmits(["navigate"]);

defineProps({
  externalItems: { type: Array, default: () => [] },
  routeItems: { type: Array, default: () => [] },
});
</script>
