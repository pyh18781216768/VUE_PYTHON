import { computed, onMounted, ref } from "vue";

import { requestJson } from "@/api/http";

const EMPTY_PARAMETER = {
  recordCount: 0,
  pointCount: 0,
  databaseRowCount: 0,
  latestCount: 0,
  normalCount: 0,
  warningCount: 0,
  dangerCount: 0,
  stableRate: 0,
  averageSeverity: null,
  totalInput: 0,
  trend: [],
  topItems: [],
};

const EMPTY_TASKS = {
  total: 0,
  completed: 0,
  active: 0,
  pendingReview: 0,
  rejected: 0,
  completionRate: 0,
  averageScore: null,
  statusItems: [],
  progress: [],
};

function createEmptyHomeData() {
  return {
    generatedAt: "",
    notices: [],
    parameters: {
      oc: { ...EMPTY_PARAMETER },
      angle: { ...EMPTY_PARAMETER },
      lens: { ...EMPTY_PARAMETER },
    },
    tasks: { ...EMPTY_TASKS },
  };
}

export function useManufacturingHome() {
  const homeData = ref(createEmptyHomeData());
  const loading = ref(false);
  const message = ref("");

  const ocSummary = computed(() => homeData.value.parameters?.oc || EMPTY_PARAMETER);
  const angleSummary = computed(() => homeData.value.parameters?.angle || EMPTY_PARAMETER);
  const lensSummary = computed(() => homeData.value.parameters?.lens || EMPTY_PARAMETER);
  const taskSummary = computed(() => homeData.value.tasks || EMPTY_TASKS);
  const notices = computed(() => homeData.value.notices || []);
  const generatedAt = computed(() => homeData.value.generatedAt || "");

  async function loadHomeDashboard(refresh = false) {
    loading.value = true;
    message.value = "";
    try {
      const suffix = refresh ? "?refresh=1" : "";
      homeData.value = await requestJson(`/api/home-dashboard${suffix}`);
    } catch (error) {
      message.value = error instanceof Error ? error.message : String(error);
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    void loadHomeDashboard();
  });

  return {
    angleSummary,
    generatedAt,
    lensSummary,
    loading,
    loadHomeDashboard,
    message,
    notices,
    ocSummary,
    taskSummary,
  };
}

export function formatNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue.toLocaleString("zh-Hant-TW") : "--";
}

export function formatPercent(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? `${numberValue.toFixed(1)}%` : "--";
}

export function formatMetric(value) {
  if (value === null || value === undefined || value === "") return "--";
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(3) : String(value);
}

export function formatDateTime(value) {
  return String(value || "--").replace("T", " ").slice(0, 19);
}
