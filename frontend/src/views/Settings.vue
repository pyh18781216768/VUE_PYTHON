<template>
  <section class="frontend-page">
    <div class="page-hero">
      <p class="page-kicker">Settings</p>
      <h1>系統設定</h1>
    </div>

    <p v-if="actionMessage" :class="['inline-message', actionTone === 'success' ? 'inline-success' : 'inline-error']">
      {{ actionMessage }}
    </p>

    <ShiftGroupPanel
      v-model:keyword="filters.shifts"
      :loading="loading"
      :rows="filteredResources.shifts"
      :submitting="submitting"
      @create="openCreateDialog('shifts')"
      @delete="deleteResource('shifts', $event)"
      @refresh="loadSettings"
    />

    <div class="panel-grid">
      <FloorPanel
        v-model:keyword="filters.floors"
        :rows="filteredResources.floors"
        :submitting="submitting"
        @create="openCreateDialog('floors')"
        @delete="deleteResource('floors', $event)"
      />

      <DepartmentPanel
        v-model:keyword="filters.departments"
        :rows="filteredResources.departments"
        :submitting="submitting"
        @create="openCreateDialog('departments')"
        @delete="deleteResource('departments', $event)"
      />
    </div>

    <p v-if="loading" class="subtle-text">正在載入系統設定...</p>
    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

    <SettingFormDialog
      :active-config="activeConfig"
      :active-resource="activeResource"
      :form="form"
      :message="actionMessage"
      :message-tone="actionTone"
      :open="dialogOpen"
      :submitting="submitting"
      @close="closeDialog"
      @reset="resetForm()"
      @submit="submitForm"
    />
  </section>
</template>

<script setup>
import { onMounted } from "vue";

import DepartmentPanel from "@/components/settings/DepartmentPanel.vue";
import FloorPanel from "@/components/settings/FloorPanel.vue";
import SettingFormDialog from "@/components/settings/SettingFormDialog.vue";
import ShiftGroupPanel from "@/components/settings/ShiftGroupPanel.vue";
import { useTaskSettings } from "@/composables/useTaskSettings";

const {
  actionMessage,
  actionTone,
  activeConfig,
  activeResource,
  closeDialog,
  deleteResource,
  dialogOpen,
  errorMessage,
  filteredResources,
  filters,
  form,
  loadSettings,
  loading,
  openCreateDialog,
  resetForm,
  submitForm,
  submitting,
} = useTaskSettings();

onMounted(loadSettings);
</script>
