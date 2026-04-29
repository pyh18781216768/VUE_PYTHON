<template>
  <SettingListPanel
    :columns="columns"
    create-label="新增班次"
    empty-text="暫無班次資料"
    :keyword="keyword"
    :loading="loading"
    placeholder="搜尋班次、時間、排序"
    :rows="rows"
    show-refresh
    :submitting="submitting"
    title="班次列表"
    @create="$emit('create')"
    @delete="$emit('delete', $event)"
    @refresh="$emit('refresh')"
    @update:keyword="$emit('update:keyword', $event)"
  />
</template>

<script setup>
import SettingListPanel from "@/components/settings/SettingListPanel.vue";

defineEmits(["create", "delete", "refresh", "update:keyword"]);

defineProps({
  keyword: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  rows: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false },
});

const columns = [
  { key: "name", label: "班次" },
  { key: "startTime", label: "開始時間" },
  { key: "endTime", label: "結束時間" },
  { key: "sortOrder", label: "排序" },
  { key: "actions", label: "操作" },
];
</script>
