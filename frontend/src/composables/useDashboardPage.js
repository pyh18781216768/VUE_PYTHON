import { computed, reactive, ref, watch } from "vue";

import { postDownload } from "@/api/download";
import { requestJson } from "@/api/http";
import { createDashboardChartOptions } from "@/composables/dashboard/dashboardCharts";
import { DASHBOARD_CONFIGS, createEmptyDashboard, normalizeDashboardPage } from "@/composables/dashboard/dashboardConfigs";
import { formatDashboardMetric } from "@/composables/dashboard/dashboardFormatters";
import {
  createCategoryRows,
  createExportFilters,
  createFilterOptions,
  createMetricCards,
  createTableRows,
  createTopRows,
  createTrendRows,
  filterDashboardRecords,
  sortDashboardRows,
} from "@/composables/dashboard/dashboardRows";

export function useDashboardPage(pageRef) {
  const activePage = computed(() => normalizeDashboardPage(pageRef));
  const config = computed(() => DASHBOARD_CONFIGS[activePage.value]);
  const dashboard = ref(createEmptyDashboard(activePage.value));
  const loading = ref(false);
  const exporting = ref(false);
  const message = ref("");
  const messageTone = ref("success");
  const visibleLimit = ref(300);
  const filters = reactive({});
  const sorts = ref([{ key: "severityValue", direction: "desc" }]);

  const filterFields = computed(() => config.value.filters);
  const filterOptions = computed(() => createFilterOptions(dashboard.value.dimensions, filterFields.value));
  const filteredRecords = computed(() => filterDashboardRecords(dashboard.value.records || [], filterFields.value, filters));
  const tableRows = computed(() =>
    sortDashboardRows(createTableRows(filteredRecords.value, filters, dashboard.value.metricFormat), sorts.value),
  );
  const visibleRows = computed(() => tableRows.value.slice(0, visibleLimit.value));
  const canLoadMore = computed(() => visibleRows.value.length < tableRows.value.length);
  const metricCards = computed(() => createMetricCards(tableRows.value, dashboard.value));
  const trendRows = computed(() => createTrendRows(filteredRecords.value));
  const categoryRows = computed(() => createCategoryRows(tableRows.value));
  const topRows = computed(() => createTopRows(tableRows.value));
  const chartOptions = computed(() =>
    createDashboardChartOptions({
      categoryRows: categoryRows.value,
      metricFormat: dashboard.value.metricFormat,
      metricName: config.value.metricName,
      topRows: topRows.value,
      trendRows: trendRows.value,
    }),
  );

  function resetFilters() {
    for (const key of Object.keys(filters)) delete filters[key];
    for (const field of filterFields.value) {
      filters[field.key] = field.key === "snapshotDate" ? "latest" : "";
    }
    visibleLimit.value = 300;
  }

  function showMessage(nextMessage, tone = "success") {
    message.value = nextMessage;
    messageTone.value = tone;
    window.clearTimeout(showMessage.timer);
    if (nextMessage) {
      showMessage.timer = window.setTimeout(() => {
        message.value = "";
      }, 3000);
    }
  }

  async function loadDashboard(refresh = false) {
    loading.value = true;
    visibleLimit.value = 300;
    showMessage("");
    try {
      const params = new URLSearchParams({ page: activePage.value });
      if (refresh) params.set("refresh", "1");
      dashboard.value = await requestJson(`/api/dashboard?${params.toString()}`);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
    } finally {
      loading.value = false;
    }
  }

  async function exportExcel() {
    exporting.value = true;
    try {
      await postDownload(
        "/api/export-excel",
        {
          page: activePage.value,
          filters: createExportFilters(filterFields.value, filters),
          columns: config.value.exportColumns,
        },
        config.value.exportFilename,
      );
      showMessage("匯出成功。");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
    } finally {
      exporting.value = false;
    }
  }

  function toggleSort(key, event) {
    const existingIndex = sorts.value.findIndex((item) => item.key === key);
    const nextSorts = event?.shiftKey ? [...sorts.value] : [];
    if (existingIndex < 0) {
      nextSorts.push({ key, direction: "asc" });
    } else {
      const existing = sorts.value[existingIndex];
      if (existing.direction === "asc") {
        const next = { key, direction: "desc" };
        if (event?.shiftKey) nextSorts.splice(existingIndex, 1, next);
        else nextSorts.push(next);
      } else if (event?.shiftKey) {
        nextSorts.splice(existingIndex, 1);
      } else {
        nextSorts.push({ key, direction: "asc" });
      }
    }
    sorts.value = nextSorts.length ? nextSorts : [{ key: "severityValue", direction: "desc" }];
    visibleLimit.value = 300;
  }

  function loadMoreRows() {
    visibleLimit.value = Math.min(visibleLimit.value + 300, tableRows.value.length);
  }

  watch(
    activePage,
    () => {
      dashboard.value = createEmptyDashboard(activePage.value);
      resetFilters();
      void loadDashboard();
    },
    { immediate: true },
  );

  return {
    chartOptions,
    canLoadMore,
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
    sorts,
    tableRows,
    visibleRows,
    exportExcel,
    formatMetric: (value, format = dashboard.value.metricFormat) => formatDashboardMetric(value, format),
    loadDashboard,
    loadMoreRows,
    resetFilters,
    toggleSort,
  };
}
