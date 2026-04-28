<template>
  <section class="frontend-page">
    <div class="page-hero">
      <p class="page-kicker">{{ config.kicker }}</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.subtitle }}</p>
    </div>

    <p v-if="message" :class="['inline-message', messageTone === 'success' ? 'inline-success' : 'inline-error']">
      {{ message }}
    </p>

    <DashboardFilterPanel
      :exporting="exporting"
      :fields="filterFields"
      :filters="filters"
      :loading="loading"
      :options="filterOptions"
      @export="exportExcel"
      @refresh="loadDashboard(true)"
      @reset="resetFilters"
      @search="loadDashboard(false)"
      @update-filter="updateFilter"
    />

    <DashboardMetricGrid :cards="metricCards" />

    <DashboardChartGrid :options="chartOptions" />

    <DashboardRecordTable
      :columns="config.tableColumns"
      :rows="visibleRows"
      :sorts="sorts"
      :total="tableRows.length"
      @sort-change="toggleSort"
    />

    <section class="content-panel">
      <div class="panel-title-row">
        <div>
          <h2>数据源</h2>
          <p>{{ dashboard.databasePath || "--" }}</p>
        </div>
        <span class="subtle-text">生成时间：{{ formatGeneratedAt(dashboard.generatedAt) }}</span>
      </div>
      <DataTable :columns="sourceColumns" :rows="dashboard.tables || []" row-key="tableName" />
    </section>
  </section>
</template>

<script setup>
import { toRef } from "vue";

import DataTable from "@/components/DataTable.vue";
import DashboardChartGrid from "@/components/dashboard/DashboardChartGrid.vue";
import DashboardFilterPanel from "@/components/dashboard/DashboardFilterPanel.vue";
import DashboardMetricGrid from "@/components/dashboard/DashboardMetricGrid.vue";
import DashboardRecordTable from "@/components/dashboard/DashboardRecordTable.vue";
import { useDashboardPage } from "@/composables/useDashboardPage";

const props = defineProps({
  page: { type: String, required: true },
});

const {
  chartOptions,
  config,
  dashboard,
  exporting,
  filterFields,
  filterOptions,
  filters,
  loading,
  message,
  messageTone,
  metricCards,
  resetFilters,
  sorts,
  tableRows,
  toggleSort,
  visibleRows,
  exportExcel,
  loadDashboard,
} = useDashboardPage(toRef(props, "page"));

const sourceColumns = [
  { key: "source", label: "Source" },
  { key: "tableName", label: "表名" },
  { key: "rowCount", label: "行数" },
];

function updateFilter(key, value) {
  filters[key] = value;
}

function formatGeneratedAt(value) {
  return String(value || "--").replace("T", " ").slice(0, 19);
}
</script>
