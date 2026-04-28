<template>
  <section class="frontend-page">
    <div class="page-hero">
      <p class="page-kicker">Operations</p>
      <h1>操作记录</h1>
      <p>此模块已从旧页面拆到新 Vue 工程，查询、排序和 Excel 导出都复用公共组件与组合式逻辑。</p>
    </div>

    <p v-if="message" :class="['inline-message', messageTone === 'success' ? 'inline-success' : 'inline-error']">
      {{ message }}
    </p>

    <OperationFilterPanel
      v-model:action-type="filters.actionType"
      v-model:date-from="filters.dateFrom"
      v-model:date-to="filters.dateTo"
      v-model:operator="filters.operator"
      :action-options="actionOptions"
      :exporting="exporting"
      :loading="loading"
      @export="exportOperationLogs"
      @reset-filters="resetFilters"
      @reset-sorts="resetSorts"
      @search="loadOperationLogs"
    />

    <OperationLogTable
      :format-action-label="formatActionLabel"
      :rows="rows"
      :sorts="sorts"
      @sort-change="toggleSort"
    />
  </section>
</template>

<script setup>
import { onMounted } from "vue";

import OperationFilterPanel from "@/components/operations/OperationFilterPanel.vue";
import OperationLogTable from "@/components/operations/OperationLogTable.vue";
import { useOperationLogs } from "@/composables/useOperationLogs";

const {
  actionOptions,
  exportOperationLogs,
  exporting,
  filters,
  formatActionLabel,
  loadOperationLogs,
  loading,
  message,
  messageTone,
  resetFilters,
  resetSorts,
  rows,
  sorts,
  toggleSort,
} = useOperationLogs();

onMounted(loadOperationLogs);
</script>
