import { computed, reactive, ref } from "vue";

import { postDownload } from "@/api/download";
import { requestJson } from "@/api/http";

const ACTION_LABELS = {
  "鏂板": "新增",
  "淇敼": "修改",
  "鍒櫎": "刪除",
  "鍒犻櫎": "刪除",
  "鏌ョ湅": "查看",
};

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeComparable(value) {
  return normalizeText(value).toLowerCase();
}

function compareValue(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) return leftNumber - rightNumber;
  return normalizeComparable(left).localeCompare(normalizeComparable(right), "zh-Hans-CN");
}

function getValue(row, key) {
  return String(key)
    .split(".")
    .reduce((value, part) => (value && value[part] !== undefined ? value[part] : undefined), row);
}

export function formatActionLabel(value) {
  return ACTION_LABELS[value] || value || "--";
}

export function useOperationLogs() {
  const loading = ref(false);
  const exporting = ref(false);
  const rows = ref([]);
  const message = ref("");
  const messageTone = ref("success");
  const sorts = ref([
    { key: "operatedAt", direction: "desc" },
    { key: "id", direction: "desc" },
  ]);
  const filters = reactive({
    operator: "",
    dateFrom: "",
    dateTo: "",
    actionType: "",
  });

  const actionOptions = computed(() => {
    const values = new Set();
    for (const row of rows.value) {
      if (row.actionType) values.add(row.actionType);
    }
    if (!values.size) {
      for (const action of ["新增", "修改", "刪除", "查看"]) values.add(action);
    }
    return Array.from(values).map((value) => ({ value, label: formatActionLabel(value) }));
  });

  const sortedRows = computed(() => {
    const activeSorts = sorts.value.length ? sorts.value : [{ key: "operatedAt", direction: "desc" }];
    return [...rows.value].sort((left, right) => {
      for (const sort of activeSorts) {
        const result = compareValue(getValue(left, sort.key), getValue(right, sort.key));
        if (result) return sort.direction === "asc" ? result : -result;
      }
      return 0;
    });
  });

  function currentFilters() {
    return {
      operator: normalizeText(filters.operator),
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      actionType: filters.actionType,
    };
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

  async function loadOperationLogs() {
    loading.value = true;
    showMessage("");
    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(currentFilters())) {
        if (value) params.set(key, value);
      }
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const payload = await requestJson(`/api/task-system/operation-logs${suffix}`);
      rows.value = payload.items || [];
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
    } finally {
      loading.value = false;
    }
  }

  function resetFilters() {
    filters.operator = "";
    filters.dateFrom = "";
    filters.dateTo = "";
    filters.actionType = "";
    return loadOperationLogs();
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

    sorts.value = nextSorts.length ? nextSorts : [{ key: "operatedAt", direction: "desc" }];
  }

  function resetSorts() {
    sorts.value = [
      { key: "operatedAt", direction: "desc" },
      { key: "id", direction: "desc" },
    ];
  }

  async function exportOperationLogs() {
    exporting.value = true;
    try {
      await postDownload(
        "/api/task-system/export",
        { type: "operation", format: "excel", filters: currentFilters() },
        "operation_records.xlsx",
      );
      showMessage("匯出成功。");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
    } finally {
      exporting.value = false;
    }
  }

  return {
    actionOptions,
    exporting,
    filters,
    loading,
    message,
    messageTone,
    rows: sortedRows,
    sorts,
    exportOperationLogs,
    formatActionLabel,
    loadOperationLogs,
    resetFilters,
    resetSorts,
    toggleSort,
  };
}
