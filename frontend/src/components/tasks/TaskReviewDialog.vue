<template>
  <ModalDialog :open="open" title="任務審核評分" eyebrow="Review" @close="$emit('close')">
    <form class="settings-form" @submit.prevent="$emit('submit')">
      <p v-if="form.title" class="form-span-all subtle-text">{{ form.title }}</p>
      <label>
        <span>評分</span>
        <input v-model="form.score" type="number" min="0" max="100" step="1" placeholder="0-100" />
      </label>
      <label class="form-span-all">
        <span>評語</span>
        <textarea v-model.trim="form.comment" rows="5" placeholder="填寫通過理由、扣分點或需要補充的事項"></textarea>
      </label>
      <p v-if="message" :class="['inline-message form-span-all', messageTone === 'success' ? 'inline-success' : 'inline-error']">
        {{ message }}
      </p>
      <div class="form-actions form-span-all">
        <button class="ghost-button" type="button" :disabled="submitting" @click="$emit('close')">取消</button>
        <button class="primary-button" type="submit" :disabled="submitting">
          {{ submitting ? "提交中..." : "提交評分" }}
        </button>
      </div>
    </form>
  </ModalDialog>
</template>

<script setup>
import ModalDialog from "@/components/ModalDialog.vue";

defineEmits(["close", "submit"]);

defineProps({
  form: { type: Object, required: true },
  message: { type: String, default: "" },
  messageTone: { type: String, default: "success" },
  open: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
});
</script>
