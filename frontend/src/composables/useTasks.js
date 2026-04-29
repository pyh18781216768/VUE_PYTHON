import { computed, reactive, ref } from "vue";

import { createTaskActions } from "./tasks/taskActions";
import {
  createDefaultTaskSorts,
  createRejectForm,
  createReviewForm,
  createSubmitForm,
  createTaskForm,
  DEFAULT_PRIORITY_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
  TASK_FORM_HIDDEN_STATUSES,
} from "./tasks/taskConstants";
import {
  clearRejectForm,
  clearReviewForm,
  clearSubmitForm,
  fillRejectForm,
  fillReviewForm,
  fillSubmitForm,
  fillTaskFormFromTask,
  resetTaskForm as resetTaskFormState,
  selectedFilesFromEvent,
} from "./tasks/taskForms";
import { clearTaskFilters, createTaskFilters } from "./tasks/taskFilters";
import {
  createHandoverRecordLabel,
  formatDateTime,
  formatTaskStatusLabel,
  getTaskPriorityBoxClass,
  getTaskStatusBoxClass,
  userOptionLabel,
} from "./tasks/taskFormatters";
import { createTaskPermissionHelpers } from "./tasks/taskPermissions";
import { getNextTaskSorts, sortTaskRows } from "./tasks/taskSorting";

export { formatDateTime, formatTaskStatusLabel, getTaskPriorityBoxClass, getTaskStatusBoxClass } from "./tasks/taskFormatters";

export function useTasks() {
  const currentUser = ref(null);
  const tasks = ref([]);
  const users = ref([]);
  const handovers = ref([]);
  const statusOptionsRaw = ref(DEFAULT_STATUS_OPTIONS);
  const priorityOptionsRaw = ref(DEFAULT_PRIORITY_OPTIONS);
  const files = ref([]);
  const submitFiles = ref([]);
  const loading = ref(false);
  const submitting = ref(false);
  const exporting = ref(false);
  const message = ref("");
  const messageTone = ref("success");
  const taskDialogOpen = ref(false);
  const rejectDialogOpen = ref(false);
  const submitDialogOpen = ref(false);
  const reviewDialogOpen = ref(false);
  const detailTask = ref(null);
  const previewFile = ref(null);
  const filters = reactive(createTaskFilters());
  const form = reactive(createTaskForm());
  const rejectForm = reactive(createRejectForm());
  const submitForm = reactive(createSubmitForm());
  const reviewForm = reactive(createReviewForm());
  const sorts = ref(createDefaultTaskSorts());

  const isAdmin = computed(() => Number(currentUser.value?.permissionLevel || 1) >= 5);
  const isEditing = computed(() => Boolean(form.id));
  const userOptions = computed(() => users.value.map((item) => ({ value: item.username, label: userOptionLabel(item) })));
  const mentionUserOptions = computed(() => userOptions.value);
  const statusOptions = computed(() => statusOptionsRaw.value.map((item) => ({ value: item, label: formatTaskStatusLabel(item) })));
  const taskFormStatusOptions = computed(() => {
    const options = statusOptions.value.filter((item) => !TASK_FORM_HIDDEN_STATUSES.has(item.value));
    if (TASK_FORM_HIDDEN_STATUSES.has(form.status)) {
      return [...options, { value: form.status, label: formatTaskStatusLabel(form.status) }];
    }
    return options;
  });
  const priorityOptions = computed(() => priorityOptionsRaw.value.map((item) => ({ value: item, label: item })));
  const handoverOptions = computed(() =>
    handovers.value.map((item) => ({ value: String(item.id), label: getHandoverRecordLabel(item.id) })),
  );

  const sortedRows = computed(() => sortTaskRows(tasks.value, sorts.value));
  const { canClaimTask, canEditTask, canRejectTask, canReviewTask, canSubmitTask } = createTaskPermissionHelpers({
    currentUser,
    users,
    isAdmin,
  });

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

  function resetTaskForm() {
    resetTaskFormState(form);
    files.value = [];
  }

  function openCreateDialog() {
    resetTaskForm();
    showMessage("");
    taskDialogOpen.value = true;
  }

  function openEditDialog(task) {
    fillTaskFormFromTask(form, task);
    showMessage("");
    taskDialogOpen.value = true;
  }

  function closeTaskDialog() {
    taskDialogOpen.value = false;
    resetTaskForm();
  }

  function deleteCurrentTask() {
    if (!form.id) return false;
    return deleteTask({ id: form.id });
  }

  function openRejectDialog(task) {
    fillRejectForm(rejectForm, task);
    showMessage("");
    rejectDialogOpen.value = true;
  }

  function closeRejectDialog() {
    rejectDialogOpen.value = false;
    clearRejectForm(rejectForm);
  }

  function openSubmitDialog(task) {
    fillSubmitForm(submitForm, task);
    submitFiles.value = [];
    showMessage("");
    submitDialogOpen.value = true;
  }

  function closeSubmitDialog() {
    submitDialogOpen.value = false;
    clearSubmitForm(submitForm);
    submitFiles.value = [];
  }

  function openReviewDialog(task) {
    fillReviewForm(reviewForm, task);
    showMessage("");
    reviewDialogOpen.value = true;
  }

  function closeReviewDialog() {
    reviewDialogOpen.value = false;
    clearReviewForm(reviewForm);
  }

  function resetFilters() {
    clearTaskFilters(filters);
    return loadTasks();
  }

  function resetSorts() {
    sorts.value = createDefaultTaskSorts();
  }

  function toggleSort(key, event) {
    sorts.value = getNextTaskSorts(sorts.value, key, event);
  }

  function handleFileSelection(event) {
    files.value = selectedFilesFromEvent(event);
  }

  function handleSubmitFileSelection(event) {
    submitFiles.value = selectedFilesFromEvent(event);
  }

  function openDetail(task) {
    detailTask.value = task;
  }

  function closeDetail() {
    detailTask.value = null;
  }

  function openPreview(file) {
    previewFile.value = file;
  }

  function closePreview() {
    previewFile.value = null;
  }

  function getHandoverRecordLabel(recordId) {
    return createHandoverRecordLabel(recordId, handovers.value, formatDateTime);
  }

  const {
    claimTask,
    deleteTask,
    exportTasks,
    loadTasks,
    submitReject,
    submitReviewRequest,
    submitReviewScore,
    submitTask,
  } = createTaskActions({
    closeRejectDialog,
    closeReviewDialog,
    closeSubmitDialog,
    closeTaskDialog,
    currentUser,
    exporting,
    files,
    filters,
    form,
    handovers,
    loading,
    priorityOptionsRaw,
    rejectForm,
    reviewForm,
    showMessage,
    statusOptionsRaw,
    submitFiles,
    submitForm,
    submitting,
    tasks,
    users,
  });

  return {
    canClaimTask,
    canEditTask,
    canRejectTask,
    canReviewTask,
    canSubmitTask,
    claimTask,
    closeDetail,
    closePreview,
    closeRejectDialog,
    closeReviewDialog,
    closeSubmitDialog,
    closeTaskDialog,
    deleteCurrentTask,
    deleteTask,
    detailTask,
    exportTasks,
    exporting,
    files,
    filters,
    form,
    formatDateTime,
    formatTaskStatusLabel,
    getHandoverRecordLabel,
    getTaskPriorityBoxClass,
    getTaskStatusBoxClass,
    handleFileSelection,
    handleSubmitFileSelection,
    handoverOptions,
    isEditing,
    loadTasks,
    loading,
    mentionUserOptions,
    message,
    messageTone,
    openCreateDialog,
    openDetail,
    openEditDialog,
    openPreview,
    openRejectDialog,
    openReviewDialog,
    openSubmitDialog,
    previewFile,
    priorityOptions,
    rejectDialogOpen,
    rejectForm,
    resetFilters,
    resetSorts,
    resetTaskForm,
    reviewDialogOpen,
    reviewForm,
    rows: sortedRows,
    sorts,
    statusOptions,
    submitDialogOpen,
    submitFiles,
    submitForm,
    submitReject,
    submitReviewRequest,
    submitReviewScore,
    submitTask,
    submitting,
    taskDialogOpen,
    taskFormStatusOptions,
    toggleSort,
    userOptions,
  };
}
