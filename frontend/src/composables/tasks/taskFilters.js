import { normalizeText } from "./taskFormatters";

export function createTaskFilters() {
  return {
    keyword: "",
    status: "",
    assigneeUser: "",
    handoverRecordId: "",
  };
}

export function getTaskFilters(filters) {
  return {
    keyword: normalizeText(filters.keyword),
    status: filters.status,
    assigneeUser: filters.assigneeUser,
    handoverRecordId: filters.handoverRecordId,
  };
}

export function clearTaskFilters(filters) {
  Object.assign(filters, createTaskFilters());
}
