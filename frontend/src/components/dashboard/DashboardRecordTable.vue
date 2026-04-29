<template>
  <section class="content-panel">
    <div class="panel-title-row">
      <div>
        <h2>參數明細</h2>
      </div>
      <span class="subtle-text">顯示 {{ rows.length }} / {{ total }} 筆</span>
    </div>
    <DataTable
      :columns="columns"
      empty-text="目前條件下沒有看板資料。"
      :rows="rows"
      :sorts="sorts"
      @sort-change="(key, event) => $emit('sort-change', key, event)"
    />
  </section>
</template>

<script setup>
import DataTable from "@/components/DataTable.vue";

defineEmits(["sort-change"]);

defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  sorts: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
});
</script>
