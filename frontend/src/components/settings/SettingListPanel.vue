<template>
  <section class="content-panel">
    <div class="panel-title-row">
      <div>
        <h2>{{ title }}</h2>
      </div>
      <button class="primary-button" type="button" @click="$emit('create')">{{ createLabel }}</button>
    </div>
    <div class="toolbar-row">
      <label class="search-field">
        <span>关键词</span>
        <input
          :value="keyword"
          type="text"
          :placeholder="placeholder"
          @input="$emit('update:keyword', $event.target.value.trim())"
        />
      </label>
      <button v-if="showRefresh" class="ghost-button" type="button" :disabled="loading" @click="$emit('refresh')">
        刷新
      </button>
    </div>
    <DataTable :columns="columns" :rows="rows" :empty-text="emptyText">
      <template #cell-actions="{ row }">
        <button class="danger-button table-button" type="button" :disabled="submitting" @click="$emit('delete', row)">
          删除
        </button>
      </template>
    </DataTable>
  </section>
</template>

<script setup>
import DataTable from "@/components/DataTable.vue";

defineEmits(["create", "delete", "refresh", "update:keyword"]);

defineProps({
  columns: { type: Array, required: true },
  createLabel: { type: String, required: true },
  emptyText: { type: String, default: "暂无设置数据" },
  keyword: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  placeholder: { type: String, default: "搜索名称、排序" },
  rows: { type: Array, default: () => [] },
  showRefresh: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  title: { type: String, required: true },
});
</script>
