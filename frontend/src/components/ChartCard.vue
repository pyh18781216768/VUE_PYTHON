<template>
  <article class="chart-card" :class="accentClass">
    <div class="chart-card-header">
      <div>
        <p v-if="eyebrow" class="chart-card-eyebrow">{{ eyebrow }}</p>
        <h3>{{ title }}</h3>
      </div>
      <span v-if="badge" class="chart-card-badge">{{ badge }}</span>
    </div>
    <strong class="chart-card-value">{{ displayValue }}</strong>
    <p v-if="subtitle" class="chart-card-subtitle">{{ subtitle }}</p>
    <slot />
  </article>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], default: "--" },
  subtitle: { type: String, default: "" },
  eyebrow: { type: String, default: "" },
  badge: { type: String, default: "" },
  accent: { type: String, default: "cyan" },
});

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === "") return "--";
  return props.value;
});

const accentClass = computed(() => `chart-card-${props.accent}`);
</script>
