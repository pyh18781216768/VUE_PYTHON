export function upsertTask(tasks, task) {
  if (!task) return;
  const index = tasks.value.findIndex((item) => Number(item.id) === Number(task.id));
  if (index >= 0) tasks.value.splice(index, 1, task);
  else tasks.value.unshift(task);
}

export function removeTaskById(tasks, taskId) {
  tasks.value = tasks.value.filter((item) => Number(item.id) !== Number(taskId));
}
