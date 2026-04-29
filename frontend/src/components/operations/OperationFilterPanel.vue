<template>
  <section class="content-panel">
    <form class="operation-filter-grid" @submit.prevent="$emit('search')">
      <label class="search-field">
        <span>操作人</span>
        <input
          :value="operator"
          type="text"
          placeholder="搜尋工號或姓名"
          @input="$emit('update:operator', $event.target.value.trim())"
        />
      </label>
      <label class="search-field">
        <span>開始日期</span>
        <input :value="dateFrom" type="date" @input="$emit('update:dateFrom', $event.target.value)" />
      </label>
      <label class="search-field">
        <span>結束日期</span>
        <input :value="dateTo" type="date" @input="$emit('update:dateTo', $event.target.value)" />
      </label>
      <SearchableSelect
        :model-value="actionType"
        class="search-field"
        label="操作功能"
        :options="actionOptions"
        placeholder="全部"
        @update:model-value="$emit('update:actionType', $event)"
      />
      <div class="operation-actions">
        <button class="ghost-button" type="button" :disabled="loading" @click="$emit('reset-filters')">重置篩選</button>
        <button class="ghost-button" type="button" @click="$emit('reset-sorts')">重置排序</button>
        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? "查詢中..." : "查詢" }}
        </button>
        <button class="primary-button" type="button" :disabled="exporting" @click="$emit('export')">
          {{ exporting ? "匯出中..." : "匯出 Excel" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import SearchableSelect from "@/components/base/SearchableSelect.vue";

defineEmits([
  "export",
  "reset-filters",
  "reset-sorts",
  "search",
  "update:actionType",
  "update:dateFrom",
  "update:dateTo",
  "update:operator",
]);

defineProps({
  actionOptions: { type: Array, default: () => [] },
  actionType: { type: String, default: "" },
  dateFrom: { type: String, default: "" },
  dateTo: { type: String, default: "" },
  exporting: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  operator: { type: String, default: "" },
});
</script>
