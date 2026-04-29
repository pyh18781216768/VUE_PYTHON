<template>
  <SettingListPanel
    :columns="columns"
    create-label="新增部門"
    empty-text="暫無部門資料"
    :keyword="keyword"
    placeholder="搜尋部門、排序"
    :rows="rows"
    :submitting="submitting"
    title="部門列表"
    @create="$emit('create')"
    @delete="$emit('delete', $event)"
    @update:keyword="$emit('update:keyword', $event)"
  />
</template>

<script setup>
import SettingListPanel from "@/components/settings/SettingListPanel.vue";

defineEmits(["create", "delete", "update:keyword"]);

defineProps({
  keyword: { type: String, default: "" },
  rows: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false },
});

const columns = [
  { key: "name", label: "名稱" },
  { key: "sortOrder", label: "排序" },
  { key: "createdAt", label: "建立時間" },
  { key: "actions", label: "操作" },
];
</script>
