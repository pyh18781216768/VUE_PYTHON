import { computed, reactive, ref } from "vue";

import { deleteUserByUsername, loadUserLookups, saveUser, saveUserPermission } from "./users/userApi";
import { createDefaultUserSorts, createPermissionForm, createUserForm, ROLE_OPTIONS } from "./users/userConstants";
import {
  fillPermissionFormFromUser,
  fillUserFormFromUser,
  resetPermissionForm as resetPermissionFormState,
  resetUserForm as resetUserFormState,
  validateUserForm,
} from "./users/userForms";
import { formatDateTime, getRoleLabel } from "./users/userFormatters";
import { getNextUserSorts, sortUserRows } from "./users/userSorting";

export { ROLE_OPTIONS } from "./users/userConstants";
export { formatDateTime, getRoleLabel } from "./users/userFormatters";

export function useUsers() {
  const currentUser = ref(null);
  const users = ref([]);
  const departments = ref([]);
  const loading = ref(false);
  const submitting = ref(false);
  const message = ref("");
  const messageTone = ref("success");
  const userDialogOpen = ref(false);
  const permissionDialogOpen = ref(false);
  const detailUser = ref(null);
  const filters = reactive({
    keyword: "",
    role: "",
  });
  const form = reactive(createUserForm());
  const permissionForm = reactive(createPermissionForm());
  const sorts = ref(createDefaultUserSorts());

  const isSuperAdmin = computed(() => currentUser.value?.role === "admin");
  const isEditingUser = computed(() => Boolean(form.originalUsername));

  const departmentOptions = computed(() =>
    departments.value.map((item) => ({ value: item.name, label: item.name })),
  );

  const sortedUsers = computed(() => sortUserRows(users.value, filters, sorts.value));

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

  function resetUserForm() {
    resetUserFormState(form);
  }

  function resetPermissionForm() {
    resetPermissionFormState(permissionForm);
  }

  async function loadUsers() {
    loading.value = true;
    showMessage("");
    try {
      const { departmentPayload, sessionPayload, userPayload } = await loadUserLookups();
      currentUser.value = sessionPayload.authenticated ? sessionPayload.user : null;
      users.value = userPayload.items || [];
      departments.value = departmentPayload.items || [];
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
    } finally {
      loading.value = false;
    }
  }

  function openCreateUserDialog() {
    resetUserForm();
    showMessage("");
    userDialogOpen.value = true;
  }

  function openEditUserDialog(user) {
    fillUserFormFromUser(form, user);
    showMessage("");
    userDialogOpen.value = true;
  }

  function closeUserDialog() {
    userDialogOpen.value = false;
    resetUserForm();
  }

  function openPermissionDialog(user) {
    fillPermissionFormFromUser(permissionForm, user);
    showMessage("");
    permissionDialogOpen.value = true;
  }

  function closePermissionDialog() {
    permissionDialogOpen.value = false;
    resetPermissionForm();
  }

  function openUserDetail(user) {
    detailUser.value = user;
  }

  function closeUserDetail() {
    detailUser.value = null;
  }

  async function submitUser() {
    const validationMessage = validateUserForm(form, isEditingUser.value);
    if (validationMessage) {
      showMessage(validationMessage, "error");
      return false;
    }

    submitting.value = true;
    try {
      const payload = await saveUser(form);
      const savedUser = payload.item;
      const index = users.value.findIndex((item) => item.username === savedUser.username || item.id === savedUser.id);
      if (index >= 0) users.value.splice(index, 1, savedUser);
      else users.value.unshift(savedUser);
      closeUserDialog();
      showMessage("使用者資訊已儲存。");
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  async function submitPermission() {
    if (!permissionForm.username) return false;
    submitting.value = true;
    try {
      const payload = await saveUserPermission(permissionForm.username, permissionForm.role);
      const savedUser = payload.item;
      const index = users.value.findIndex((item) => item.username === savedUser.username);
      if (index >= 0) users.value.splice(index, 1, savedUser);
      closePermissionDialog();
      showMessage("使用者權限已更新。");
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  async function deleteCurrentUser() {
    const username = form.originalUsername || form.username;
    if (!username) return false;
    if (!window.confirm(`確認刪除帳號 ${username}？此操作不可復原。`)) return false;

    submitting.value = true;
    try {
      await deleteUserByUsername(username);
      users.value = users.value.filter((item) => item.username !== username);
      closeUserDialog();
      showMessage("使用者已刪除。");
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  function resetFilters() {
    filters.keyword = "";
    filters.role = "";
  }

  function resetSorts() {
    sorts.value = createDefaultUserSorts();
  }

  function toggleSort(key, event) {
    sorts.value = getNextUserSorts(sorts.value, key, event);
  }

  return {
    departmentOptions,
    detailUser,
    filters,
    form,
    isEditingUser,
    isSuperAdmin,
    loading,
    message,
    messageTone,
    permissionDialogOpen,
    permissionForm,
    roleOptions: ROLE_OPTIONS,
    rows: sortedUsers,
    sorts,
    submitting,
    userDialogOpen,
    closePermissionDialog,
    closeUserDetail,
    closeUserDialog,
    deleteCurrentUser,
    formatDateTime,
    getRoleLabel,
    loadUsers,
    openCreateUserDialog,
    openEditUserDialog,
    openPermissionDialog,
    openUserDetail,
    resetFilters,
    resetSorts,
    resetUserForm,
    submitPermission,
    submitUser,
    toggleSort,
  };
}
