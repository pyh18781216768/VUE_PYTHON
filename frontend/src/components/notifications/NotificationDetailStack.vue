<template>
  <HandoverDetailDialog
    :format-date-time="formatDateTime"
    :record="selectedHandover"
    @close="$emit('close-handover')"
    @preview="$emit('open-preview', $event)"
  />
  <TaskDetailDialog
    action-mode
    :action-message="actionMessage"
    :action-message-tone="actionMessageTone"
    :action-submitting="actionSubmitting"
    :can-claim="Boolean(selectedTask && canClaimTask(selectedTask))"
    :can-reject="Boolean(selectedTask && canRejectTask(selectedTask))"
    :can-review="Boolean(selectedTask && canReviewTask(selectedTask))"
    :format-date-time="formatDateTime"
    :format-task-status-label="formatTaskStatusLabel"
    :get-handover-record-label="getHandoverRecordLabel"
    :task="selectedTask"
    @claim="$emit('claim-task', $event)"
    @close="$emit('close-task')"
    @preview="$emit('open-preview', $event)"
    @reject="$emit('reject-task', $event)"
    @review="$emit('review-task', $event)"
  />
  <AttachmentPreviewDialog :file="previewFile" @close="$emit('close-preview')" />
</template>

<script setup>
import AttachmentPreviewDialog from "@/components/handover/AttachmentPreviewDialog.vue";
import HandoverDetailDialog from "@/components/handover/HandoverDetailDialog.vue";
import TaskDetailDialog from "@/components/tasks/TaskDetailDialog.vue";

defineEmits([
  "claim-task",
  "close-handover",
  "close-preview",
  "close-task",
  "open-preview",
  "reject-task",
  "review-task",
]);

defineProps({
  actionMessage: { type: String, default: "" },
  actionMessageTone: { type: String, default: "success" },
  actionSubmitting: { type: Boolean, default: false },
  canClaimTask: { type: Function, required: true },
  canRejectTask: { type: Function, required: true },
  canReviewTask: { type: Function, required: true },
  formatDateTime: { type: Function, required: true },
  formatTaskStatusLabel: { type: Function, required: true },
  getHandoverRecordLabel: { type: Function, required: true },
  previewFile: { type: Object, default: null },
  selectedHandover: { type: Object, default: null },
  selectedTask: { type: Object, default: null },
});
</script>
