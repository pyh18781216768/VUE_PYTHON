export function findHandoverForNotification(item, handovers) {
  if (!item || item.type !== "handover") return null;
  return handovers.find((record) => Number(record.id) === Number(item.handoverRecordId)) || null;
}

export function findTaskForNotification(item, tasks) {
  if (!item || item.type !== "task") return null;
  return tasks.find((task) => Number(task.id) === Number(item.taskId)) || null;
}
