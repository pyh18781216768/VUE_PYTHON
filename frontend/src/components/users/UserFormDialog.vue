<template>
  <ModalDialog
    :open="open"
    :title="isEditing ? '編輯使用者' : '新增使用者'"
    eyebrow="User"
    @close="$emit('close')"
  >
    <form class="settings-form user-management-form" @submit.prevent="$emit('submit')">
      <label>
        <span>工號</span>
        <input
          v-model.trim="form.username"
          type="text"
          placeholder="輸入工號"
          :readonly="isEditing"
        />
      </label>
      <label>
        <span>姓名</span>
        <input v-model.trim="form.displayName" type="text" placeholder="顯示名稱" />
      </label>
      <SearchableSelect
        v-if="isSuperAdmin"
        v-model="form.role"
        class="search-field"
        label="職位"
        :options="roleOptions"
        :allow-empty="false"
      />
      <label v-else>
        <span>職位</span>
        <input :value="roleLabel(form.role)" type="text" readonly title="只有超級管理員可以賦予權限" />
      </label>
      <label>
        <span>郵箱</span>
        <input v-model.trim="form.email" type="email" />
      </label>
      <label>
        <span>電話</span>
        <input v-model.trim="form.phone" type="text" />
      </label>
      <SearchableSelect
        v-model="form.department"
        class="search-field"
        label="部門"
        :options="departmentOptions"
        empty-label="不選擇部門"
        placeholder=""
      />
      <label>
        <span>密碼</span>
        <input v-model="form.password" type="password" autocomplete="new-password" placeholder="新建必填，編輯留空不改" />
      </label>
      <p v-if="message" :class="['inline-message form-span-all', messageTone === 'success' ? 'inline-success' : 'inline-error']">
        {{ message }}
      </p>
      <div class="form-actions form-span-all">
        <button v-if="isEditing" class="danger-button" type="button" :disabled="submitting" @click="$emit('delete')">
          刪除
        </button>
        <button v-else class="ghost-button" type="button" :disabled="submitting" @click="$emit('reset')">
          重置
        </button>
        <button class="primary-button" type="submit" :disabled="submitting">
          {{ submitting ? "儲存中..." : "儲存使用者" }}
        </button>
      </div>
    </form>
  </ModalDialog>
</template>

<script setup>
import ModalDialog from "@/components/ModalDialog.vue";
import SearchableSelect from "@/components/base/SearchableSelect.vue";

defineEmits(["close", "delete", "reset", "submit"]);

defineProps({
  departmentOptions: { type: Array, default: () => [] },
  form: { type: Object, required: true },
  isEditing: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false },
  message: { type: String, default: "" },
  messageTone: { type: String, default: "success" },
  open: { type: Boolean, default: false },
  roleLabel: { type: Function, required: true },
  roleOptions: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false },
});
</script>
