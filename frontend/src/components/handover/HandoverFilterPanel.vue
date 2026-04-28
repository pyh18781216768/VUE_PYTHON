<template>
  <section class="content-panel">
    <div class="panel-title-row">
      <div>
        <h2>交接班查詢</h2>
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
        <input v-model.trim="filters.keyword" type="text" placeholder="搜尋關鍵詞、情況、注意事項" />
      </label>
      <label class="search-field">
        <span>開始日期</span>
        <input v-model="filters.dateFrom" type="date" />
      </label>
      <label class="search-field">
        <span>結束日期</span>
        <input v-model="filters.dateTo" type="date" />
      </label>
      <SearchableSelect
        v-model="filters.shiftGroupId"
        class="search-field"
        label="班次"
        :options="shiftOptions"
        empty-label="全部"
      />
      <SearchableSelect
        v-model="filters.handoverUser"
        class="search-field"
        label="交班人"
        :options="userOptions"
        empty-label="全部"
      />
      <SearchableSelect
        v-model="filters.receiverUser"
        class="search-field"
        label="接班人"
        :options="userOptions"
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
  loading: { type: Boolean, default: false },
  shiftOptions: { type: Array, default: () => [] },
  userOptions: { type: Array, default: () => [] },
});
</script>
