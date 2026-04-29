<template>
  <section class="content-panel">
    <div class="panel-title-row">
      <div>
        <h2>操作記錄列表</h2>
      </div>
      <span class="subtle-text">共 {{ rows.length }} 筆</span>
    </div>
    <DataTable
      :columns="columns"
      :rows="rows"
      :sorts="sorts"
      empty-text="目前條件下沒有操作記錄。"
      @sort-change="(key, event) => $emit('sort-change', key, event)"
    >
      <template #cell-operatorLabel="{ row }">
        <span :title="row.operatorUser">{{ row.operatorLabel || row.operatorUser || "--" }}</span>
      </template>
      <template #cell-actionType="{ value }">
        <span class="status-pill">{{ formatActionLabel(value) }}</span>
      </template>
      <template #cell-recordLabel="{ row }">
        <span :title="row.recordLabel">{{ row.recordLabel || row.recordId || "--" }}</span>
      </template>
    </DataTable>
  </section>
</template>

<script setup>
import DataTable from "@/components/DataTable.vue";

defineEmits(["sort-change"]);

defineProps({
  formatActionLabel: { type: Function, required: true },
  rows: { type: Array, default: () => [] },
  sorts: { type: Array, default: () => [] },
});

const columns = [
  { key: "id", label: "ID", sortable: true },
  { key: "operatorLabel", label: "操作人", sortable: true },
  { key: "operatedAt", label: "操作時間", sortable: true },
  { key: "pageName", label: "操作頁面", sortable: true },
  { key: "actionType", label: "操作功能", sortable: true },
  { key: "recordLabel", label: "操作記錄", sortable: true },
];
</script>
