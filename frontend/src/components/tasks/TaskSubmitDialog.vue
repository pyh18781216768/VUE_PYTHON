<template>
  <ModalDialog :open="open" title="提交任務審核" eyebrow="Submit" @close="$emit('close')">
    <form class="settings-form" @submit.prevent="$emit('submit')">
      <p v-if="form.title" class="form-span-all subtle-text">{{ form.title }}</p>
      <label class="form-span-all">
        <span>提交內容</span>
        <textarea v-model.trim="form.content" rows="6" placeholder="填寫處理結果、現場情況、結論或需要審核人關注的內容"></textarea>
      </label>
      <FileUploadField class="form-span-all" :files="files" label="回覆附件" @file-change="$emit('file-change', $event)" />
      <p v-if="files.length" class="subtle-text form-span-all">已選擇 {{ files.length }} 個附件</p>
      <p v-if="message" :class="['inline-message form-span-all', messageTone === 'success' ? 'inline-success' : 'inline-error']">
        {{ message }}
      </p>
      <div class="form-actions form-span-all">
        <button class="ghost-button" type="button" :disabled="submitting" @click="$emit('close')">取消</button>
        <button class="primary-button" type="submit" :disabled="submitting">
          {{ submitting ? "提交中..." : "提交審核" }}
        </button>
      </div>
    </form>
  </ModalDialog>
</template>

<script setup>
import FileUploadField from "@/components/base/FileUploadField.vue";
import ModalDialog from "@/components/ModalDialog.vue";

defineEmits(["close", "file-change", "submit"]);

const props = defineProps({
  files: { type: Array, default: () => [] },
  form: { type: Object, required: true },
  message: { type: String, default: "" },
  messageTone: { type: String, default: "success" },
  open: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
});
</script>
