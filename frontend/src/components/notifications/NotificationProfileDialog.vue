<template>
  <ModalDialog :open="open" title="個人資訊" eyebrow="Profile" @close="$emit('close')">
    <form class="settings-form user-management-form" @submit.prevent="submitProfile">
      <label>
        <span>工號</span>
        <input :value="form.username || '--'" type="text" readonly />
      </label>
      <label>
        <span>姓名</span>
        <input v-model.trim="form.displayName" type="text" placeholder="顯示名稱" />
      </label>
      <label>
        <span>職位</span>
        <input :value="roleLabel(user?.role)" type="text" readonly />
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
        :options="profileDepartmentOptions"
        empty-label="不選擇部門"
        placeholder=""
      />
      <SearchableSelect
        v-model="form.supervisorUser"
        class="search-field form-span-all"
        label="主管"
        :options="availableSupervisorOptions"
        empty-label="不設定主管"
        placeholder="搜尋主管"
      />
      <label>
        <span>新密碼</span>
        <input v-model="form.newPassword" type="password" autocomplete="new-password" placeholder="留空則不修改" />
      </label>
      <label>
        <span>確認新密碼</span>
        <input v-model="form.confirmPassword" type="password" autocomplete="new-password" placeholder="再次輸入新密碼" />
      </label>
      <p v-if="message" :class="['inline-message form-span-all', messageTone === 'success' ? 'inline-success' : 'inline-error']">
        {{ message }}
      </p>
      <div class="form-actions form-span-all">
        <button class="ghost-button" type="button" :disabled="submitting" @click="resetForm">重置</button>
        <button class="primary-button" type="submit" :disabled="submitting">
          {{ submitting ? "儲存中..." : "儲存個人資訊" }}
        </button>
      </div>
    </form>
  </ModalDialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";

import { requestJson } from "@/api/http";
import SearchableSelect from "@/components/base/SearchableSelect.vue";
import ModalDialog from "@/components/ModalDialog.vue";
import { getRoleLabel } from "@/composables/users/userFormatters";

const props = defineProps({
  departmentOptions: { type: Array, default: () => [] },
  open: { type: Boolean, default: false },
  supervisorOptions: { type: Array, default: () => [] },
  user: { type: Object, default: null },
});

const emit = defineEmits(["close", "saved"]);

const form = reactive(createProfileForm());
const message = ref("");
const messageTone = ref("success");
const submitting = ref(false);

const availableSupervisorOptions = computed(() =>
  props.supervisorOptions.filter((item) => item.value && item.value !== props.user?.username),
);
const profileDepartmentOptions = computed(() => {
  if (!form.department || props.departmentOptions.some((item) => item.value === form.department)) {
    return props.departmentOptions;
  }
  return [{ value: form.department, label: form.department }, ...props.departmentOptions];
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) resetForm();
  },
  { immediate: true },
);

function createProfileForm() {
  return {
    username: "",
    displayName: "",
    department: "",
    supervisorUser: "",
    email: "",
    phone: "",
    newPassword: "",
    confirmPassword: "",
  };
}

function resetForm() {
  const user = props.user || {};
  form.username = user.username || "";
  form.displayName = user.displayName || user.displayLabel || "";
  form.department = user.department || "";
  form.supervisorUser = user.supervisorUser || "";
  form.email = user.email || "";
  form.phone = user.phone || "";
  form.newPassword = "";
  form.confirmPassword = "";
  showMessage("");
}

function roleLabel(role) {
  return getRoleLabel(role);
}

function showMessage(nextMessage, tone = "success") {
  message.value = nextMessage;
  messageTone.value = tone;
  window.clearTimeout(showMessage.timer);
  if (nextMessage) {
    showMessage.timer = window.setTimeout(() => {
      message.value = "";
    }, 3000);
  }
}

async function submitProfile() {
  if (form.newPassword || form.confirmPassword) {
    if (form.newPassword !== form.confirmPassword) {
      showMessage("兩次輸入的新密碼不一致。", "error");
      return false;
    }
    if (form.newPassword.length < 6) {
      showMessage("新密碼長度不能少於 6 位。", "error");
      return false;
    }
  }

  submitting.value = true;
  try {
    const payload = await requestJson("/api/profile", {
      method: "POST",
      body: JSON.stringify({ ...form }),
    });
    emit("saved", payload.user);
    form.newPassword = "";
    form.confirmPassword = "";
    showMessage(payload.message || "個人資訊已儲存。");
    return true;
  } catch (error) {
    showMessage(error instanceof Error ? error.message : String(error), "error");
    return false;
  } finally {
    submitting.value = false;
  }
}
</script>
