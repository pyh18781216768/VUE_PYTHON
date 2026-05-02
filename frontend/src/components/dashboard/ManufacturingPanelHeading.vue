<template>
  <div class="neon-panel-heading">
    <div>
      <span>{{ number }}</span>
      <h2>{{ title }}</h2>
    </div>
    <a v-if="to" class="neon-panel-more" :href="to">更多 ›</a>
    <button v-else type="button">更多 ›</button>
  </div>
</template>

<script setup>
defineProps({
  number: { type: String, required: true },
  to: { type: String, default: "" },
  title: { type: String, required: true },
});
</script>
