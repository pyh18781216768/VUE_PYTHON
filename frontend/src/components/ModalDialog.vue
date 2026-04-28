<template>
  <Teleport to="body">
    <div v-if="open" class="frontend-modal-layer">
      <div class="frontend-modal-backdrop" aria-hidden="true"></div>
      <article class="frontend-modal-card" @click.stop>
        <header class="frontend-modal-head">
          <div>
            <p v-if="eyebrow" class="page-kicker">{{ eyebrow }}</p>
            <h2>{{ title }}</h2>
          </div>
          <button class="ghost-button" type="button" @click="$emit('close')">关闭</button>
        </header>
        <slot />
      </article>
    </div>
  </Teleport>
</template>

<script setup>
defineEmits(["close"]);

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  eyebrow: { type: String, default: "" },
});
</script>
