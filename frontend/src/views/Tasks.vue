<template>
  <section class="frontend-page">
    <div class="page-hero">
      <p class="page-kicker">Tasks</p>
      <h1>任務清單</h1>
      <p>任務查詢、新增、領取、駁回、提交審核、評分與附件已拆到新 Vue 工程。</p>
    </div>

    <p v-if="message" :class="['inline-message', messageTone === 'success' ? 'inline-success' : 'inline-error']">
      {{ message }}
    </p>

    <TaskFilterPanel
      :exporting="exporting"
      :filters="filters"
      :handover-options="handoverOptions"
      :loading="loading"
      :status-options="statusOptions"
      :user-options="userOptions"
      @create="openCreateDialog"
      @export="exportTasks"
      @reset-filters="resetFilters"
      @reset-sorts="resetSorts"
      @search="loadTasks"
    />

    <TaskTable
      :can-claim-task="canClaimTask"
      :can-edit-task="canEditTask"
      :can-reject-task="canRejectTask"
      :can-review-task="canReviewTask"
      :can-submit-task="canSubmitTask"
      :columns="columns"
      :format-date-time="formatDateTime"
      :get-task-priority-box-class="getTaskPriorityBoxClass"
      :get-task-status-box-class="getTaskStatusBoxClass"
      :rows="rows"
      :sorts="sorts"
      @claim="claimTask"
      @open-detail="openDetail"
      @open-edit="openEditDialog"
      @open-preview="openPreview"
      @open-reject="openRejectDialog"
      @open-review="openReviewDialog"
      @open-submit="openSubmitDialog"
      @sort-change="toggleSort"
    />

    <TaskFormDialog
      :files="files"
      :form="form"
      :handover-options="handoverOptions"
      :is-editing="isEditing"
      :mention-user-options="mentionUserOptions"
      :message="message"
      :message-tone="messageTone"
      :open="taskDialogOpen"
      :priority-options="priorityOptions"
      :status-options="taskFormStatusOptions"
      :submitting="submitting"
      :user-options="userOptions"
      @close="closeTaskDialog"
      @delete="deleteCurrentTask"
      @file-change="handleFileSelection"
      @reset="resetTaskForm"
      @submit="submitTask"
    />

    <TaskRejectDialog
      :form="rejectForm"
      :message="message"
      :message-tone="messageTone"
      :open="rejectDialogOpen"
      :submitting="submitting"
      @close="closeRejectDialog"
      @submit="submitReject"
    />

    <TaskSubmitDialog
      :files="submitFiles"
      :form="submitForm"
      :message="message"
      :message-tone="messageTone"
      :open="submitDialogOpen"
      :submitting="submitting"
      @close="closeSubmitDialog"
      @file-change="handleSubmitFileSelection"
      @submit="submitReviewRequest"
    />

    <TaskReviewDialog
      :form="reviewForm"
      :message="message"
      :message-tone="messageTone"
      :open="reviewDialogOpen"
      :submitting="submitting"
      @close="closeReviewDialog"
      @submit="submitReviewScore"
    />

    <TaskDetailDialog
      :format-date-time="formatDateTime"
      :get-handover-record-label="getHandoverRecordLabel"
      :task="detailTask"
      @close="closeDetail"
      @preview="openPreview"
    />

    <AttachmentPreviewDialog :file="previewFile" @close="closePreview" />
  </section>
</template>

<script setup>
import { onMounted } from "vue";

import AttachmentPreviewDialog from "@/components/handover/AttachmentPreviewDialog.vue";
import TaskDetailDialog from "@/components/tasks/TaskDetailDialog.vue";
import TaskFilterPanel from "@/components/tasks/TaskFilterPanel.vue";
import TaskFormDialog from "@/components/tasks/TaskFormDialog.vue";
import TaskRejectDialog from "@/components/tasks/TaskRejectDialog.vue";
import TaskReviewDialog from "@/components/tasks/TaskReviewDialog.vue";
import TaskSubmitDialog from "@/components/tasks/TaskSubmitDialog.vue";
import TaskTable from "@/components/tasks/TaskTable.vue";
import { useTasks } from "@/composables/useTasks";

const {
  canClaimTask,
  canEditTask,
  canRejectTask,
  canReviewTask,
  canSubmitTask,
  claimTask,
  closeDetail,
  closePreview,
  closeRejectDialog,
  closeReviewDialog,
  closeSubmitDialog,
  closeTaskDialog,
  deleteCurrentTask,
  detailTask,
  exportTasks,
  exporting,
  files,
  filters,
  form,
  formatDateTime,
  getHandoverRecordLabel,
  getTaskPriorityBoxClass,
  getTaskStatusBoxClass,
  handleFileSelection,
  handleSubmitFileSelection,
  handoverOptions,
  isEditing,
  loadTasks,
  loading,
  mentionUserOptions,
  message,
  messageTone,
  openCreateDialog,
  openDetail,
  openEditDialog,
  openPreview,
  openRejectDialog,
  openReviewDialog,
  openSubmitDialog,
  previewFile,
  priorityOptions,
  rejectDialogOpen,
  rejectForm,
  resetFilters,
  resetSorts,
  resetTaskForm,
  reviewDialogOpen,
  reviewForm,
  rows,
  sorts,
  statusOptions,
  submitDialogOpen,
  submitFiles,
  submitForm,
  submitReject,
  submitReviewRequest,
  submitReviewScore,
  submitTask,
  submitting,
  taskDialogOpen,
  taskFormStatusOptions,
  toggleSort,
  userOptions,
} = useTasks();

const columns = [
  { key: "id", label: "ID", sortable: true },
  { key: "title", label: "標題", sortable: true },
  { key: "status", label: "狀態", sortable: true },
  { key: "priority", label: "優先級", sortable: true },
  { key: "assigneeUser", label: "負責人", sortable: true },
  { key: "startAt", label: "開始時間", sortable: true },
  { key: "dueAt", label: "到期時間", sortable: true },
  { key: "reviewSubmission", label: "審核" },
  { key: "attachments", label: "附件" },
  { key: "actions", label: "操作" },
];

onMounted(loadTasks);
</script>
