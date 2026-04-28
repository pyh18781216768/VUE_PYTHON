<template>
  <section class="frontend-page">
    <div class="page-hero">
      <p class="page-kicker">Users</p>
      <h1>使用者管理</h1>
      <p>帳號查詢、排序、新增、編輯、刪除與權限賦予已拆到新 Vue 工程。</p>
    </div>

    <p v-if="message" :class="['inline-message', messageTone === 'success' ? 'inline-success' : 'inline-error']">
      {{ message }}
    </p>

    <UserFilterPanel
      :filters="filters"
      :loading="loading"
      :role-options="roleOptions"
      @create="openCreateUserDialog"
      @refresh="loadUsers"
      @reset-filters="resetFilters"
      @reset-sorts="resetSorts"
    />

    <UserTable
      :columns="columns"
      :format-date-time="formatDateTime"
      :get-role-label="getRoleLabel"
      :is-super-admin="isSuperAdmin"
      :rows="rows"
      :sorts="sorts"
      @open-detail="openUserDetail"
      @open-edit="openEditUserDialog"
      @open-permission="openPermissionDialog"
      @sort-change="toggleSort"
    />

    <UserFormDialog
      :department-options="departmentOptions"
      :form="form"
      :is-editing="isEditingUser"
      :is-super-admin="isSuperAdmin"
      :message="message"
      :message-tone="messageTone"
      :open="userDialogOpen"
      :role-label="getRoleLabel"
      :role-options="roleOptions"
      :submitting="submitting"
      @close="closeUserDialog"
      @delete="deleteCurrentUser"
      @reset="resetUserForm"
      @submit="submitUser"
    />

    <UserPermissionDialog
      :form="permissionForm"
      :message="message"
      :message-tone="messageTone"
      :open="permissionDialogOpen"
      :role-label="getRoleLabel"
      :role-options="roleOptions"
      :submitting="submitting"
      @close="closePermissionDialog"
      @submit="submitPermission"
    />

    <UserDetailDialog
      :format-date-time="formatDateTime"
      :role-label="getRoleLabel"
      :user="detailUser"
      @close="closeUserDetail"
    />
  </section>
</template>

<script setup>
import { onMounted } from "vue";

import UserDetailDialog from "@/components/users/UserDetailDialog.vue";
import UserFilterPanel from "@/components/users/UserFilterPanel.vue";
import UserFormDialog from "@/components/users/UserFormDialog.vue";
import UserPermissionDialog from "@/components/users/UserPermissionDialog.vue";
import UserTable from "@/components/users/UserTable.vue";
import { useUsers } from "@/composables/useUsers";

const {
  closePermissionDialog,
  closeUserDetail,
  closeUserDialog,
  deleteCurrentUser,
  departmentOptions,
  detailUser,
  filters,
  form,
  formatDateTime,
  getRoleLabel,
  isEditingUser,
  isSuperAdmin,
  loadUsers,
  loading,
  message,
  messageTone,
  openCreateUserDialog,
  openEditUserDialog,
  openPermissionDialog,
  openUserDetail,
  permissionDialogOpen,
  permissionForm,
  resetFilters,
  resetSorts,
  resetUserForm,
  roleOptions,
  rows,
  sorts,
  submitting,
  submitPermission,
  submitUser,
  toggleSort,
  userDialogOpen,
} = useUsers();

const columns = [
  { key: "id", label: "ID", sortable: true },
  { key: "username", label: "工號", sortable: true },
  { key: "displayLabel", label: "姓名", sortable: true },
  { key: "role", label: "職位", sortable: true },
  { key: "department", label: "部門", sortable: true },
  { key: "createdAt", label: "建立時間", sortable: true },
  { key: "updatedAt", label: "更新時間", sortable: true },
  { key: "actions", label: "操作" },
];

onMounted(loadUsers);
</script>
