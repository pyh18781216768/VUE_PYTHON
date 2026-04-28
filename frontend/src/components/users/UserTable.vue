<template>
  <section class="content-panel">
    <div class="panel-title-row">
      <div>
        <h2>帳號列表</h2>
      </div>
      <span class="subtle-text">共 {{ rows.length }} 筆</span>
    </div>
    <DataTable
      :columns="columns"
      :rows="rows"
      :sorts="sorts"
      empty-text="目前條件下沒有使用者資料"
      row-key="username"
      @row-dblclick="$emit('open-detail', $event)"
      @sort-change="(key, event) => $emit('sort-change', key, event)"
    >
      <template #cell-role="{ value }">
        <span class="status-pill">{{ getRoleLabel(value) }}</span>
      </template>
      <template #cell-createdAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
      <template #cell-updatedAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
      <template #cell-actions="{ row }">
        <div class="table-action-row" @dblclick.stop>
          <button class="ghost-button table-button" type="button" @click="$emit('open-edit', row)">編輯</button>
          <button v-if="isSuperAdmin" class="primary-button table-button" type="button" @click="$emit('open-permission', row)">
            權限
          </button>
        </div>
      </template>
    </DataTable>
  </section>
</template>

<script setup>
import DataTable from "@/components/DataTable.vue";

defineEmits(["open-detail", "open-edit", "open-permission", "sort-change"]);

defineProps({
  columns: { type: Array, required: true },
  formatDateTime: { type: Function, required: true },
  getRoleLabel: { type: Function, required: true },
  isSuperAdmin: { type: Boolean, default: false },
  rows: { type: Array, default: () => [] },
  sorts: { type: Array, default: () => [] },
});
</script>
