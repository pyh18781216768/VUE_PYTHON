<template>
  <HandoverDetailDialog
    :format-date-time="formatDateTime"
    :record="selectedHandover"
    @close="$emit('close-handover')"
    @preview="$emit('open-preview', $event)"
  />
  <TaskDetailDialog
    :format-date-time="formatDateTime"
    :get-handover-record-label="getHandoverRecordLabel"
    :task="selectedTask"
    @close="$emit('close-task')"
    @preview="$emit('open-preview', $event)"
  />
  <AttachmentPreviewDialog :file="previewFile" @close="$emit('close-preview')" />
</template>

<script setup>
import AttachmentPreviewDialog from "@/components/handover/AttachmentPreviewDialog.vue";
import HandoverDetailDialog from "@/components/handover/HandoverDetailDialog.vue";
import TaskDetailDialog from "@/components/tasks/TaskDetailDialog.vue";

defineEmits(["close-handover", "close-preview", "close-task", "open-preview"]);

defineProps({
  formatDateTime: { type: Function, required: true },
  getHandoverRecordLabel: { type: Function, required: true },
  previewFile: { type: Object, default: null },
  selectedHandover: { type: Object, default: null },
  selectedTask: { type: Object, default: null },
});
</script>
