export const READ_STORAGE_PREFIX = "fab_notification_reads_";
export const CLEARED_STORAGE_PREFIX = "fab_notification_cleared_";
export const REFRESH_INTERVAL_MS = 60 * 1000;

export function createEmptyReminders() {
  return { dueTasks: [], shiftReminders: [], reviewNotifications: [], mentionNotifications: [] };
}
