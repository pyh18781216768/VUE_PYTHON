<template>
  <ModalDialog :open="open" :title="`新增${activeConfig.label}`" eyebrow="Create" @close="$emit('close')">
    <form class="settings-form" @submit.prevent="$emit('submit')">
      <label>
        <span>{{ activeConfig.label }}名稱</span>
        <input v-model.trim="form.name" type="text" :placeholder="`${activeConfig.label}名稱`" />
      </label>
      <template v-if="activeResource === 'shifts'">
        <label>
          <span>開始時間</span>
          <input v-model="form.startTime" type="time" />
        </label>
        <label>
          <span>結束時間</span>
          <input v-model="form.endTime" type="time" />
        </label>
      </template>
      <label>
        <span>排序</span>
        <input v-model.number="form.sortOrder" type="number" />
      </label>
      <p v-if="message" :class="['inline-message form-span-all', messageTone === 'success' ? 'inline-success' : 'inline-error']">
        {{ message }}
      </p>
      <div class="form-actions form-span-all">
        <button class="ghost-button" type="button" @click="$emit('reset')">重置</button>
        <button class="primary-button" type="submit" :disabled="submitting">
          {{ submitting ? "儲存中..." : `儲存${activeConfig.label}` }}
        </button>
      </div>
    </form>
  </ModalDialog>
</template>

<script setup>
import ModalDialog from "@/components/ModalDialog.vue";

defineEmits(["close", "reset", "submit"]);

defineProps({
  activeConfig: { type: Object, required: true },
  activeResource: { type: String, required: true },
  form: { type: Object, required: true },
  message: { type: String, default: "" },
  messageTone: { type: String, default: "success" },
  open: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
});
</script>
