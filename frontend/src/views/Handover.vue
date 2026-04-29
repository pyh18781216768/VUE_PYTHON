<template>
  <section class="frontend-page">
    <div class="page-hero">
      <p class="page-kicker">Handover</p>
      <h1>交接班記錄</h1>
    </div>

    <p v-if="message" :class="['inline-message', messageTone === 'success' ? 'inline-success' : 'inline-error']">
      {{ message }}
    </p>

    <HandoverFilterPanel
      :exporting="exporting"
      :filters="filters"
      :loading="loading"
      :shift-options="shiftOptions"
      :user-options="userOptions"
      @create="openCreateDialog"
      @export="exportHandovers"
      @reset-filters="resetFilters"
      @reset-sorts="resetSorts"
      @search="loadHandovers"
    />

    <HandoverTable
      :columns="columns"
      :format-date-time="formatDateTime"
      :rows="rows"
      :sorts="sorts"
      @open-detail="openDetail"
      @open-edit="openEditDialog"
      @open-preview="openPreview"
      @sort-change="toggleSort"
    />

    <HandoverFormDialog
      :files="files"
      :floor-options="floorOptions"
      :form="form"
      :is-editing="isEditing"
      :mention-user-options="mentionUserOptions"
      :message="message"
      :message-tone="messageTone"
      :open="formDialogOpen"
      :shift-options="shiftOptions"
      :submitting="submitting"
      :user-options="userOptions"
      @close="closeFormDialog"
      @delete="deleteCurrentHandover"
      @file-change="handleFileSelection"
      @reset="resetForm"
      @submit="submitHandover"
    />

    <HandoverDetailDialog
      :format-date-time="formatDateTime"
      :record="detailRecord"
      @close="closeDetail"
      @preview="openPreview"
    />

    <AttachmentPreviewDialog :file="previewFile" @close="closePreview" />
  </section>
</template>

<script setup>
import { onMounted } from "vue";

import AttachmentPreviewDialog from "@/components/handover/AttachmentPreviewDialog.vue";
import HandoverDetailDialog from "@/components/handover/HandoverDetailDialog.vue";
import HandoverFilterPanel from "@/components/handover/HandoverFilterPanel.vue";
import HandoverFormDialog from "@/components/handover/HandoverFormDialog.vue";
import HandoverTable from "@/components/handover/HandoverTable.vue";
import { useHandovers } from "@/composables/useHandovers";

const {
  closeDetail,
  closeFormDialog,
  closePreview,
  deleteCurrentHandover,
  detailRecord,
  exportHandovers,
  exporting,
  files,
  filters,
  floorOptions,
  form,
  formDialogOpen,
  formatDateTime,
  handleFileSelection,
  isEditing,
  loadHandovers,
  loading,
  mentionUserOptions,
  message,
  messageTone,
  openCreateDialog,
  openDetail,
  openEditDialog,
  openPreview,
  previewFile,
  resetFilters,
  resetForm,
  resetSorts,
  rows,
  shiftOptions,
  sorts,
  submitting,
  submitHandover,
  toggleSort,
  userOptions,
} = useHandovers();

const columns = [
  { key: "id", label: "ID", sortable: true },
  { key: "keywords", label: "關鍵詞", sortable: true },
  { key: "shiftName", label: "交班班次", sortable: true },
  { key: "receiverShiftName", label: "接班班次", sortable: true },
  { key: "floorName", label: "樓層", sortable: true },
  { key: "handoverUser", label: "交班人", sortable: true },
  { key: "receiverUser", label: "接班人", sortable: true },
  { key: "pendingItems", label: "未完成事項", sortable: true },
  { key: "attachments", label: "附件" },
  { key: "actions", label: "操作" },
];

onMounted(loadHandovers);
</script>
