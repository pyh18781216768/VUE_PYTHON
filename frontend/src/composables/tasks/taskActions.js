import {
  claimTaskById,
  deleteTaskById,
  exportTaskRows,
  fetchTaskRows,
  loadTaskLookups,
  rejectTaskById,
  saveTask,
  submitTaskForReview,
  submitTaskReviewScore,
} from "./taskApi";
import { DEFAULT_PRIORITY_OPTIONS, DEFAULT_STATUS_OPTIONS } from "./taskConstants";
import { getTaskFilters } from "./taskFilters";
import { normalizeText } from "./taskFormatters";
import { upsertTask, removeTaskById } from "./taskCollection";
import { validateTaskForm } from "./taskForms";

export function createTaskActions(context) {
  const {
    closeRejectDialog,
    closeReviewDialog,
    closeSubmitDialog,
    closeTaskDialog,
    currentUser,
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
    exporting,
  } = context;

  async function loadLookups() {
    const { sessionPayload, bootstrapPayload } = await loadTaskLookups();
    currentUser.value = sessionPayload.authenticated ? sessionPayload.user : null;
    users.value = bootstrapPayload.users || [];
    handovers.value = bootstrapPayload.handovers || [];
    statusOptionsRaw.value = bootstrapPayload.statusOptions || DEFAULT_STATUS_OPTIONS;
    priorityOptionsRaw.value = bootstrapPayload.priorityOptions || DEFAULT_PRIORITY_OPTIONS;
  }

  async function loadTasks() {
    loading.value = true;
    showMessage("");
    try {
      await loadLookups();
      const payload = await fetchTaskRows(getTaskFilters(filters));
      tasks.value = payload.items || [];
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
    } finally {
      loading.value = false;
    }
  }

  async function submitTask() {
    const validationMessage = validateTaskForm(form);
    if (validationMessage) {
      showMessage(validationMessage, "error");
      return false;
    }

    submitting.value = true;
    try {
      const payload = await saveTask(form, files.value);
      upsertTask(tasks, payload.item);
      closeTaskDialog();
      showMessage("任務已儲存。");
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  async function deleteTask(task) {
    if (!task?.id) return false;
    if (!window.confirm(`確認刪除任務 #${task.id}？此操作會同時刪除附件。`)) return false;
    submitting.value = true;
    try {
      await deleteTaskById(task.id);
      removeTaskById(tasks, task.id);
      if (Number(form.id) === Number(task.id)) closeTaskDialog();
      showMessage("任務已刪除。");
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  async function claimTask(task) {
    submitting.value = true;
    try {
      const payload = await claimTaskById(task.id);
      upsertTask(tasks, payload.item);
      showMessage("任務已領取。");
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  async function submitReject() {
    const taskId = Number(rejectForm.taskId);
    const reason = normalizeText(rejectForm.reason);
    if (!taskId) return false;
    if (!reason) {
      showMessage("請輸入駁回理由。", "error");
      return false;
    }
    submitting.value = true;
    try {
      const payload = await rejectTaskById(taskId, reason);
      upsertTask(tasks, payload.item);
      closeRejectDialog();
      showMessage("任務已駁回。");
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  async function submitReviewRequest() {
    const taskId = Number(submitForm.taskId);
    const content = normalizeText(submitForm.content);
    if (!taskId) return false;
    if (!content) {
      showMessage("請輸入提交內容。", "error");
      return false;
    }
    submitting.value = true;
    try {
      const payload = await submitTaskForReview(taskId, content, submitFiles.value);
      upsertTask(tasks, payload.item);
      closeSubmitDialog();
      showMessage("任務已提交審核。");
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  async function submitReviewScore() {
    const taskId = Number(reviewForm.taskId);
    const score = Number(reviewForm.score);
    if (!taskId) return false;
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      showMessage("評分必須在 0-100 之間。", "error");
      return false;
    }
    submitting.value = true;
    try {
      const payload = await submitTaskReviewScore(taskId, score, reviewForm.comment);
      upsertTask(tasks, payload.item);
      closeReviewDialog();
      showMessage("評分已提交。");
      return true;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
      return false;
    } finally {
      submitting.value = false;
    }
  }

  async function exportTasks() {
    exporting.value = true;
    try {
      await exportTaskRows(getTaskFilters(filters));
      showMessage("匯出成功。");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : String(error), "error");
    } finally {
      exporting.value = false;
    }
  }

  return {
    claimTask,
    deleteTask,
    exportTasks,
    loadTasks,
    submitReject,
    submitReviewRequest,
    submitReviewScore,
    submitTask,
  };
}
