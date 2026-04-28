<template>
  <section class="content-panel">
    <div class="panel-title-row">
      <div>
        <h2>参数明细</h2>
        <p>列表默认展示前 300 条，Excel 会导出当前筛选条件下的完整数据。</p>
      </div>
      <span class="subtle-text">显示 {{ rows.length }} / {{ total }} 条</span>
    </div>
    <DataTable
      :columns="columns"
      empty-text="当前条件下没有看板数据。"
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
