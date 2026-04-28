<template>
  <section class="content-panel">
    <form class="dashboard-filter-grid" @submit.prevent="$emit('search')">
      <SearchableSelect
        v-for="field in fields"
        :key="field.key"
        :model-value="filters[field.key]"
        class="search-field"
        :empty-label="field.key === 'snapshotDate' ? '最新数据' : '全部'"
        :label="field.label"
        :options="options[field.key] || []"
        :placeholder="field.key === 'snapshotDate' ? '选择快照日期' : `搜索${field.label}`"
        @update:model-value="$emit('update-filter', field.key, $event)"
      />
      <div class="dashboard-filter-actions">
        <button class="ghost-button" type="button" :disabled="loading" @click="$emit('reset')">重置筛选</button>
        <button class="ghost-button" type="button" :disabled="loading" @click="$emit('refresh')">刷新数据</button>
        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? "查询中..." : "查询" }}
        </button>
        <button class="primary-button" type="button" :disabled="exporting" @click="$emit('export')">
          {{ exporting ? "导出中..." : "导出 Excel" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import SearchableSelect from "@/components/base/SearchableSelect.vue";

defineEmits(["export", "refresh", "reset", "search", "update-filter"]);

defineProps({
  exporting: { type: Boolean, default: false },
  fields: { type: Array, default: () => [] },
  filters: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  options: { type: Object, default: () => ({}) },
});
</script>
