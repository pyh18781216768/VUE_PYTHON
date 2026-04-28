import { formatDateTime, formatReminderRemaining, parseTime } from "./notificationFormatters";

function createShiftItems(reminders) {
  return (reminders.shiftReminders || []).map((item) => {
    const id = item.reminderId || `handover:${item.handoverRecordId || item.shiftName}:${item.startTime}`;
    return {
      id,
      type: "handover",
      category: "handover",
      typeLabel: "交接班提醒",
      title: item.reminderTitle || `${item.receiverShiftName || item.shiftName || ""}接班提醒`,
      description: [
        item.handoverUser && item.receiverUser ? `${item.handoverUser} → ${item.receiverUser}` : "",
        item.keywords || "",
        `剩余 ${formatReminderRemaining(item)}`,
      ]
        .filter(Boolean)
        .join(" / "),
      time: item.startTime,
      handoverRecordId: item.handoverRecordId,
    };
  });
}

function createTaskItems(reminders) {
  return (reminders.dueTasks || []).map((item) => {
    const reminderTime = item.reminderTime || item.startAt || item.dueAt;
    const timeLabel = item.timeLabel || (item.reminderKind === "due" ? "到期时间" : "开始时间");
    const remainingText = formatReminderRemaining(item);
    const id = item.reminderId || `task:${item.id}:${reminderTime}`;
    return {
      id,
      type: "task",
      category: item.reminderKind === "due" ? "due" : "task",
      typeLabel: item.reminderKind === "due" ? "任务到期提醒" : "任务提醒",
      title: item.reminderTitle || item.title,
      description: [
        item.assigneeUser ? `负责人：${item.assigneeUser}` : "",
        `${timeLabel}：${formatDateTime(reminderTime)}`,
        remainingText === "已到期" ? "已到期" : `剩余 ${remainingText}`,
      ]
        .filter(Boolean)
        .join(" / "),
      time: reminderTime,
      taskId: item.id,
    };
  });
}

function createReviewItems(reminders) {
  return (reminders.reviewNotifications || []).map((item) => {
    const reminderTime = item.reminderTime || item.reviewedAt || item.submittedAt || "";
    const id = item.reminderId || `task-review:${item.taskId}:${reminderTime}`;
    return {
      id,
      type: "task",
      category: "task",
      typeLabel: "任务提醒",
      title: item.reminderTitle || item.title,
      description:
        item.description ||
        [
          item.assigneeUser ? `负责人：${item.assigneeUser}` : "",
          item.reviewStatusLabel ? `状态：${item.reviewStatusLabel}` : "",
          item.grade ? `等级：${item.grade}` : "",
        ]
          .filter(Boolean)
          .join(" / "),
      time: reminderTime,
      taskId: item.taskId,
    };
  });
}

function createMentionItems(reminders) {
  return (reminders.mentionNotifications || []).map((item) => {
    const isHandover = item.sourceType === "handover";
    const reminderTime = item.reminderTime || "";
    const id =
      item.reminderId ||
      `mention:${item.sourceType || "task"}:${item.taskId || item.handoverRecordId || item.title}:${reminderTime}`;
    return {
      id,
      type: isHandover ? "handover" : "task",
      category: "mention",
      typeLabel: "@提醒",
      title: item.title || item.reminderTitle || "@提醒",
      description:
        item.description ||
        [
          item.sourceLabel || (isHandover ? "交接班记录" : "任务清单"),
          item.assigneeUser ? `负责人：${item.assigneeUser}` : "",
          item.handoverUser && item.receiverUser ? `${item.handoverUser} → ${item.receiverUser}` : "",
        ]
          .filter(Boolean)
          .join(" / "),
      time: reminderTime,
      taskId: item.taskId,
      handoverRecordId: item.handoverRecordId,
    };
  });
}

export function createNotificationItems(reminders, readIds, clearedIds) {
  return [
    ...createShiftItems(reminders),
    ...createTaskItems(reminders),
    ...createReviewItems(reminders),
    ...createMentionItems(reminders),
  ]
    .filter((item) => !clearedIds.has(item.id))
    .map((item) => ({ ...item, unread: !readIds.has(item.id) }))
    .sort((left, right) => {
      if (left.unread !== right.unread) return left.unread ? -1 : 1;
      return parseTime(right.time) - parseTime(left.time);
    });
}
