<template>
  <section class="content-panel">
    <div class="panel-title-row">
      <div>
        <h2>任務查詢</h2>
      </div>
      <div class="table-action-row">
        <button class="primary-button" type="button" @click="$emit('create')">新增</button>
        <button class="ghost-button" type="button" :disabled="exporting" @click="$emit('export')">
          {{ exporting ? "匯出中..." : "匯出 Excel" }}
        </button>
      </div>
    </div>

    <form class="operation-filter-grid" @submit.prevent="$emit('search')">
      <label class="search-field">
        <span>關鍵詞</span>
        <input v-model.trim="filters.keyword" type="text" placeholder="搜尋任務標題、描述、駁回理由" />
      </label>
      <SearchableSelect
        v-model="filters.status"
        class="search-field"
        label="狀態"
        :options="statusOptions"
        empty-label="全部"
      />
      <SearchableSelect
        v-model="filters.assigneeUser"
        class="search-field"
        label="負責人"
        :options="userOptions"
        empty-label="全部"
      />
      <SearchableSelect
        v-model="filters.handoverRecordId"
        class="search-field"
        label="關聯交接班"
        :options="handoverOptions"
        empty-label="全部"
      />
      <div class="operation-actions">
        <button class="ghost-button" type="button" :disabled="loading" @click="$emit('reset-filters')">重置篩選</button>
        <button class="ghost-button" type="button" @click="$emit('reset-sorts')">重置排序</button>
        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? "查詢中..." : "查詢" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import SearchableSelect from "@/components/base/SearchableSelect.vue";

defineEmits(["create", "export", "reset-filters", "reset-sorts", "search"]);

defineProps({
  exporting: { type: Boolean, default: false },
  filters: { type: Object, required: true },
  handoverOptions: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  statusOptions: { type: Array, default: () => [] },
  userOptions: { type: Array, default: () => [] },
});
</script>
