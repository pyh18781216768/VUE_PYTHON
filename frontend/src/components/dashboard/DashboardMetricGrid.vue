<template>
  <div class="metric-grid">
    <ChartCard
      v-for="card in cards"
      :key="card.title"
      :accent="card.accent"
      :subtitle="card.subtitle"
      :title="card.title"
      :value="card.value"
    />
  </div>
</template>

<script setup>
import ChartCard from "@/components/ChartCard.vue";

defineProps({
  cards: { type: Array, default: () => [] },
});
</script>
