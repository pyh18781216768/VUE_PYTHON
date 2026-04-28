<template>
  <SettingListPanel
    :columns="columns"
    create-label="新增楼层"
    empty-text="暂无楼层数据"
    :keyword="keyword"
    placeholder="搜索楼层、排序"
    :rows="rows"
    :submitting="submitting"
    title="楼层列表"
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
  { key: "name", label: "名称" },
  { key: "sortOrder", label: "排序" },
  { key: "createdAt", label: "创建时间" },
  { key: "actions", label: "操作" },
];
</script>
