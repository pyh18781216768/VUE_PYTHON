<template>
  <ModalDialog :open="open" title="賦予使用者權限" eyebrow="Permission" @close="$emit('close')">
    <form class="settings-form user-management-form" @submit.prevent="$emit('submit')">
      <label>
        <span>工號</span>
        <input :value="form.username" type="text" readonly />
      </label>
      <label>
        <span>姓名</span>
        <input :value="form.displayLabel" type="text" readonly />
      </label>
      <label>
        <span>目前權限</span>
        <input :value="roleLabel(form.currentRole)" type="text" readonly />
      </label>
      <SearchableSelect
        v-model="form.role"
        class="search-field"
        label="賦予權限"
        :options="roleOptions"
        :allow-empty="false"
      />
      <p v-if="message" :class="['inline-message form-span-all', messageTone === 'success' ? 'inline-success' : 'inline-error']">
        {{ message }}
      </p>
      <div class="form-actions form-span-all">
        <button class="ghost-button" type="button" :disabled="submitting" @click="$emit('close')">取消</button>
        <button class="primary-button" type="submit" :disabled="submitting">
          {{ submitting ? "儲存中..." : "儲存權限" }}
        </button>
      </div>
    </form>
  </ModalDialog>
</template>

<script setup>
import ModalDialog from "@/components/ModalDialog.vue";
import SearchableSelect from "@/components/base/SearchableSelect.vue";

defineEmits(["close", "submit"]);

defineProps({
  form: { type: Object, required: true },
  message: { type: String, default: "" },
  messageTone: { type: String, default: "success" },
  open: { type: Boolean, default: false },
  roleLabel: { type: Function, required: true },
  roleOptions: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false },
});
</script>
