<template>
  <section class="content-panel">
    <div class="panel-title-row">
      <div>
        <h2>歷史交接班</h2>
      </div>
      <span class="subtle-text">共 {{ rows.length }} 筆</span>
    </div>
    <DataTable
      :columns="columns"
      :rows="rows"
      :sorts="sorts"
      empty-text="目前條件下沒有交接班記錄"
      @row-dblclick="$emit('open-detail', $event)"
      @sort-change="(key, event) => $emit('sort-change', key, event)"
    >
      <template #cell-createdAt="{ row }">
        {{ formatDateTime(row.createdAt || row.recordTime) }}
      </template>
      <template #cell-mentionUserLabels="{ value }">
        <span :title="value">{{ value || "--" }}</span>
      </template>
      <template #cell-pendingItems="{ value }">
        <span :title="value">{{ value || "--" }}</span>
      </template>
      <template #cell-attachments="{ row }">
        <div @dblclick.stop>
          <AttachmentList :attachments="row.attachments || []" @preview="$emit('open-preview', $event)" />
        </div>
      </template>
      <template #cell-actions="{ row }">
        <div class="table-action-row" @dblclick.stop>
          <button class="ghost-button table-button" type="button" @click="$emit('open-edit', row)">編輯</button>
        </div>
      </template>
    </DataTable>
  </section>
</template>

<script setup>
import DataTable from "@/components/DataTable.vue";
import AttachmentList from "@/components/handover/AttachmentList.vue";

defineEmits(["open-detail", "open-edit", "open-preview", "sort-change"]);

defineProps({
  columns: { type: Array, required: true },
  formatDateTime: { type: Function, required: true },
  rows: { type: Array, default: () => [] },
  sorts: { type: Array, default: () => [] },
});
</script>
