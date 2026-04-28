<template>
  <ModalDialog :open="open" title="駁回任務" eyebrow="Reject" @close="$emit('close')">
    <form class="settings-form" @submit.prevent="$emit('submit')">
      <p v-if="form.title" class="form-span-all subtle-text">{{ form.title }}</p>
      <label class="form-span-all">
        <span>駁回理由</span>
        <textarea v-model.trim="form.reason" rows="5" placeholder="請輸入駁回原因、需要補充的資訊或處理建議"></textarea>
      </label>
      <p v-if="message" :class="['inline-message form-span-all', messageTone === 'success' ? 'inline-success' : 'inline-error']">
        {{ message }}
      </p>
      <div class="form-actions form-span-all">
        <button class="ghost-button" type="button" :disabled="submitting" @click="$emit('close')">取消</button>
        <button class="primary-button" type="submit" :disabled="submitting">
          {{ submitting ? "駁回中..." : "確認駁回" }}
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
