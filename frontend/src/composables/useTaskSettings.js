import { computed, reactive, ref } from "vue";

import { requestJson } from "@/api/http";

const RESOURCE_CONFIGS = {
  shifts: {
    label: "班次",
    endpoint: "/api/task-system/shifts",
    createDefaults: () => ({ id: "", name: "", startTime: "08:00", endTime: "16:00", sortOrder: 0 }),
  },
  floors: {
    label: "樓層",
    endpoint: "/api/task-system/floors",
    createDefaults: () => ({ id: "", name: "", sortOrder: 0 }),
  },
  departments: {
    label: "部門",
    endpoint: "/api/task-system/departments",
    createDefaults: () => ({ id: "", name: "", sortOrder: 0 }),
  },
};

function normalizeSearchText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function sortByOrderThenId(items) {
  return [...items].sort((left, right) => {
    const orderDiff = Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
    if (orderDiff) return orderDiff;
    return Number(left.id || 0) - Number(right.id || 0);
  });
}

export function useTaskSettings() {
  const loading = ref(false);
  const submitting = ref(false);
  const errorMessage = ref("");
  const actionMessage = ref("");
  const actionTone = ref("success");
  const activeResource = ref("shifts");
  const dialogOpen = ref(false);
  const filters = reactive({
    shifts: "",
    floors: "",
    departments: "",
  });
  const form = reactive(RESOURCE_CONFIGS.shifts.createDefaults());
  const resources = reactive({
    shifts: [],
    floors: [],
    departments: [],
  });

  const activeConfig = computed(() => RESOURCE_CONFIGS[activeResource.value]);

  const filteredResources = computed(() => {
    const output = {};
    for (const key of Object.keys(RESOURCE_CONFIGS)) {
      const keyword = normalizeSearchText(filters[key]);
      const rows = sortByOrderThenId(resources[key] || []);
      output[key] = keyword
        ? rows.filter((item) =>
            [item.name, item.startTime, item.endTime, item.sortOrder, item.createdAt]
              .map(normalizeSearchText)
              .some((text) => text.includes(keyword)),
          )
        : rows;
    }
    return output;
  });

  function resetForm(resource = activeResource.value) {
    const defaults = RESOURCE_CONFIGS[resource].createDefaults();
    for (const key of Object.keys(form)) delete form[key];
    Object.assign(form, defaults);
  }

  function showMessage(message, tone = "success") {
    actionMessage.value = message;
    actionTone.value = tone;
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => {
      actionMessage.value = "";
    }, 3000);
  }

  async function loadSettings() {
    loading.value = true;
    errorMessage.value = "";
    try {
      const [shiftPayload, floorPayload, departmentPayload] = await Promise.all([
        requestJson(RESOURCE_CONFIGS.shifts.endpoint),
        requestJson(RESOURCE_CONFIGS.floors.endpoint),
        requestJson(RESOURCE_CONFIGS.departments.endpoint),
      ]);
      resources.shifts = shiftPayload.items || [];
      resources.floors = floorPayload.items || [];
      resources.departments = departmentPayload.items || [];
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : String(error);
    } finally {
      loading.value = false;
    }
  }

  function openCreateDialog(resource) {
    activeResource.value = resource;
    resetForm(resource);
    actionMessage.value = "";
    dialogOpen.value = true;
  }

  function closeDialog() {
    dialogOpen.value = false;
  }

  function validateForm() {
    if (!String(form.name || "").trim()) return `${activeConfig.value.label}名称不能为空。`;
    if (activeResource.value === "shifts" && (!form.startTime || !form.endTime)) return "班次開始和結束時間不能為空。";
    return "";
  }

  async function submitForm() {
    const validationMessage = validateForm();
    if (validationMessage) {
      showMessage(validationMessage, "error");
      return false;
    }

    submitting.value = true;
    try {
      const config = activeConfig.value;
      const payload = await requestJson(config.endpoint, {
        method: "POST",
        body: JSON.stringify({ ...form, id: form.id || null }),
      });
      const savedItem = payload.item;
      const target = resources[activeResource.value];
      const existingIndex = target.findIndex((item) => item.id === savedItem.id);
      if (existingIndex >= 0) target.splice(existingIndex, 1, savedItem);
      else target.push(savedItem);
      showMessage(`${config.label}已儲存。`);
      closeDialog();
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  async function deleteResource(resource, item) {
    const config = RESOURCE_CONFIGS[resource];
    if (!window.confirm(`確認刪除${config.label}「${item.name}」嗎？`)) return false;
    submitting.value = true;
    try {
      await requestJson(`${config.endpoint}/${item.id}`, { method: "DELETE" });
      const target = resources[resource];
      const index = target.findIndex((entry) => entry.id === item.id);
      if (index >= 0) target.splice(index, 1);
      showMessage(`${config.label}已刪除。`);
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  return {
    actionMessage,
    actionTone,
    activeConfig,
    activeResource,
    dialogOpen,
    errorMessage,
    filteredResources,
    filters,
    form,
    loading,
    resources,
    submitting,
    closeDialog,
    deleteResource,
    loadSettings,
    openCreateDialog,
    resetForm,
    submitForm,
  };
}
