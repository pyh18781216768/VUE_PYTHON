import { computed, reactive, ref } from "vue";

import {
  deleteHandoverRecordById,
  exportHandoverRows,
  fetchHandoverRows,
  loadHandoverLookups,
  saveHandoverRecord,
} from "./handovers/handoverApi";
import { logOperation } from "./operationLogger";
import { createDefaultHandoverSorts, createHandoverForm } from "./handovers/handoverConstants";
import {
  fillHandoverFormFromRecord,
  resetHandoverForm,
  selectedFilesFromEvent,
  validateHandoverForm,
} from "./handovers/handoverForms";
import { formatDateTime, normalizeText, userOptionLabel } from "./handovers/handoverFormatters";
import { getNextHandoverSorts, sortHandoverRows } from "./handovers/handoverSorting";

export { formatDateTime } from "./handovers/handoverFormatters";

export function useHandovers() {
  const currentUser = ref(null);
  const handovers = ref([]);
  const shifts = ref([]);
  const floors = ref([]);
  const users = ref([]);
  const files = ref([]);
  const loading = ref(false);
  const submitting = ref(false);
  const exporting = ref(false);
  const message = ref("");
  const messageTone = ref("success");
  const formDialogOpen = ref(false);
  const detailRecord = ref(null);
  const previewFile = ref(null);
  const filters = reactive({
    keyword: "",
    dateFrom: "",
    dateTo: "",
    shiftGroupId: "",
    handoverUser: "",
    receiverUser: "",
  });
  const form = reactive(createHandoverForm());
  const sorts = ref(createDefaultHandoverSorts());

  const shiftOptions = computed(() => shifts.value.map((item) => ({ value: String(item.id), label: item.name })));
  const floorOptions = computed(() => floors.value.map((item) => ({ value: String(item.id), label: item.name })));
  const userOptions = computed(() => users.value.map((item) => ({ value: item.username, label: userOptionLabel(item) })));
  const mentionUserOptions = computed(() => userOptions.value);
  const isEditing = computed(() => Boolean(form.id));

  const sortedRows = computed(() => sortHandoverRows(handovers.value, sorts.value));

  function currentFilters() {
    return {
      keyword: normalizeText(filters.keyword),
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      shiftGroupId: filters.shiftGroupId,
      handoverUser: filters.handoverUser,
      receiverUser: filters.receiverUser,
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

  function resetForm() {
    resetHandoverForm(form, currentUser.value);
    files.value = [];
  }

  async function loadLookups() {
    const { floorPayload, sessionPayload, shiftPayload, userPayload } = await loadHandoverLookups();
    currentUser.value = sessionPayload.authenticated ? sessionPayload.user : null;
    shifts.value = shiftPayload.items || [];
    floors.value = floorPayload.items || [];
    users.value = userPayload.items || [];
  }

  async function loadHandovers() {
    loading.value = true;
    showMessage("");
    try {
      await loadLookups();
      const payload = await fetchHandoverRows(currentFilters());
      handovers.value = payload.items || [];
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
    } finally {
      loading.value = false;
    }
  }

  function openCreateDialog() {
    resetForm();
    showMessage("");
    formDialogOpen.value = true;
  }

  function openEditDialog(record) {
    fillHandoverFormFromRecord(form, record, currentUser.value);
    showMessage("");
    formDialogOpen.value = true;
  }

  function closeFormDialog() {
    formDialogOpen.value = false;
    resetForm();
  }

  async function submitHandover() {
    const validationMessage = validateHandoverForm(form);
    if (validationMessage) {
      showMessage(validationMessage, "error");
      return false;
    }

    submitting.value = true;
    try {
      const payload = await saveHandoverRecord(form, files.value);
      const savedRecord = payload.item;
      const index = handovers.value.findIndex((item) => Number(item.id) === Number(savedRecord.id));
      if (index >= 0) handovers.value.splice(index, 1, savedRecord);
      else handovers.value.unshift(savedRecord);
      closeFormDialog();
      showMessage("交接班記錄已儲存。");
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  async function deleteHandover(record) {
    if (!record?.id) return false;
    if (!window.confirm(`確認刪除交接班記錄 #${record.id}？此操作不可復原。`)) return false;
    submitting.value = true;
    try {
      await deleteHandoverRecordById(record.id);
      handovers.value = handovers.value.filter((item) => Number(item.id) !== Number(record.id));
      if (Number(form.id) === Number(record.id)) closeFormDialog();
      showMessage("交接班記錄已刪除。");
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  function deleteCurrentHandover() {
    if (!form.id) return false;
    return deleteHandover({ id: form.id });
  }

  function resetFilters() {
    filters.keyword = "";
    filters.dateFrom = "";
    filters.dateTo = "";
    filters.shiftGroupId = "";
    filters.handoverUser = "";
    filters.receiverUser = "";
    return loadHandovers();
  }

  function resetSorts() {
    sorts.value = createDefaultHandoverSorts();
  }

  function toggleSort(key, event) {
    sorts.value = getNextHandoverSorts(sorts.value, key, event);
  }

  async function exportHandovers() {
    exporting.value = true;
    try {
      await exportHandoverRows(currentFilters());
      showMessage("匯出成功。");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
    } finally {
      exporting.value = false;
    }
  }

  function openDetail(record) {
    detailRecord.value = record;
    logOperation("交接班記錄", "查看", handoverOperationLabel(record), record?.id);
  }

  function closeDetail() {
    detailRecord.value = null;
  }

  function openPreview(file) {
    previewFile.value = file;
  }

  function closePreview() {
    previewFile.value = null;
  }

  function handleFileSelection(event) {
    files.value = selectedFilesFromEvent(event);
  }

  function handoverOperationLabel(record) {
    return [
      record?.id ? `#${record.id}` : "",
      normalizeText(record?.keywords),
      normalizeText(record?.floorName),
      normalizeText(record?.receiverUser),
    ]
      .filter(Boolean)
      .join(" / ");
  }

  return {
    detailRecord,
    exporting,
    files,
    filters,
    floorOptions,
    form,
    formDialogOpen,
    isEditing,
    loading,
    mentionUserOptions,
    message,
    messageTone,
    previewFile,
    rows: sortedRows,
    shiftOptions,
    sorts,
    submitting,
    userOptions,
    closeDetail,
    closeFormDialog,
    closePreview,
    deleteCurrentHandover,
    deleteHandover,
    exportHandovers,
    formatDateTime,
    handleFileSelection,
    loadHandovers,
    openCreateDialog,
    openDetail,
    openEditDialog,
    openPreview,
    resetFilters,
    resetForm,
    resetSorts,
    submitHandover,
    toggleSort,
  };
}
