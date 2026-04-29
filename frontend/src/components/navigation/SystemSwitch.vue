<template>
  <div class="drawer-system-switch" aria-label="系統切換">
    <button type="button" :class="{ active: modelValue === 'tasks' }" @click="$emit('update:modelValue', 'tasks')">
      任務系統
    </button>
    <button type="button" :class="{ active: modelValue === 'dashboard' }" @click="$emit('update:modelValue', 'dashboard')">
      看板系統
    </button>
  </div>
</template>

<script setup>
defineEmits(["update:modelValue"]);

defineProps({
  modelValue: { type: String, required: true },
});
</script>
