<template>
  <section class="content-panel">
    <div class="panel-title-row">
      <div>
        <h2>任務清單</h2>
      </div>
      <span class="subtle-text">共 {{ rows.length }} 筆</span>
    </div>
    <DataTable
      :columns="columns"
      :rows="rows"
      :sorts="sorts"
      empty-text="目前條件下沒有任務資料"
      @row-dblclick="$emit('open-detail', $event)"
      @sort-change="(key, event) => $emit('sort-change', key, event)"
    >
      <template #cell-title="{ row }">
        <span :title="row.description">{{ row.title || "--" }}</span>
      </template>
      <template #cell-status="{ value }">
        <span :class="['task-color-box', getTaskStatusBoxClass(value)]">{{ value || "--" }}</span>
      </template>
      <template #cell-priority="{ value }">
        <span :class="['task-color-box', getTaskPriorityBoxClass(value)]">{{ value || "--" }}</span>
      </template>
      <template #cell-createdAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
      <template #cell-startAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
      <template #cell-dueAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
      <template #cell-mentionUserLabels="{ value }">
        <span :title="value">{{ value || "--" }}</span>
      </template>
      <template #cell-reviewSubmission="{ row }">
        <div class="task-review-stack">
          <span v-if="row.reviewSubmission" :class="['task-color-box', getTaskStatusBoxClass(row.status)]">
            {{ row.reviewSubmission.statusLabel }}
          </span>
          <small v-if="row.reviewSubmission && row.reviewSubmission.averageScore !== null">
            {{ row.reviewSubmission.averageScore }}分 / {{ row.reviewSubmission.grade || "--" }}
          </small>
          <span v-if="!row.reviewSubmission">--</span>
        </div>
      </template>
      <template #cell-attachments="{ row }">
        <div @dblclick.stop>
          <AttachmentList :attachments="row.attachments || []" @preview="$emit('open-preview', $event)" />
        </div>
      </template>
      <template #cell-actions="{ row }">
        <div class="task-action-buttons" @dblclick.stop>
          <button v-if="canClaimTask(row)" class="primary-button table-button" type="button" @click="$emit('claim', row)">
            領取
          </button>
          <button
            v-if="canSubmitTask(row)"
            class="primary-button table-button"
            type="button"
            @click="$emit('open-submit', row)"
          >
            提交
          </button>
          <button
            v-if="canReviewTask(row)"
            class="primary-button table-button"
            type="button"
            @click="$emit('open-review', row)"
          >
            評分
          </button>
          <button v-if="canRejectTask(row)" class="ghost-button table-button" type="button" @click="$emit('open-reject', row)">
            駁回
          </button>
          <button v-if="canEditTask(row)" class="ghost-button table-button" type="button" @click="$emit('open-edit', row)">
            編輯
          </button>
        </div>
      </template>
    </DataTable>
  </section>
</template>

<script setup>
import DataTable from "@/components/DataTable.vue";
import AttachmentList from "@/components/handover/AttachmentList.vue";

defineEmits([
  "claim",
  "open-detail",
  "open-edit",
  "open-preview",
  "open-reject",
  "open-review",
  "open-submit",
  "sort-change",
]);

defineProps({
  canClaimTask: { type: Function, required: true },
  canEditTask: { type: Function, required: true },
  canRejectTask: { type: Function, required: true },
  canReviewTask: { type: Function, required: true },
  canSubmitTask: { type: Function, required: true },
  columns: { type: Array, required: true },
  formatDateTime: { type: Function, required: true },
  getTaskPriorityBoxClass: { type: Function, required: true },
  getTaskStatusBoxClass: { type: Function, required: true },
  rows: { type: Array, default: () => [] },
  sorts: { type: Array, default: () => [] },
});
</script>
