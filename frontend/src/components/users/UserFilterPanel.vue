<template>
  <section class="content-panel">
    <div class="panel-title-row">
      <div>
        <h2>使用者查詢</h2>
      </div>
      <button class="primary-button" type="button" @click="$emit('create')">新增</button>
    </div>

    <form class="operation-filter-grid" @submit.prevent>
      <label class="search-field">
        <span>關鍵詞</span>
        <input v-model.trim="filters.keyword" type="text" placeholder="搜尋工號、姓名、部門、信箱、電話" />
      </label>
      <SearchableSelect
        v-model="filters.role"
        class="search-field"
        label="職位"
        :options="roleOptions"
        empty-label="全部"
      />
      <div class="operation-actions">
        <button class="ghost-button" type="button" :disabled="loading" @click="$emit('reset-filters')">重置篩選</button>
        <button class="ghost-button" type="button" @click="$emit('reset-sorts')">重置排序</button>
        <button class="ghost-button" type="button" :disabled="loading" @click="$emit('refresh')">
          {{ loading ? "刷新中..." : "刷新" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import SearchableSelect from "@/components/base/SearchableSelect.vue";

defineEmits(["create", "refresh", "reset-filters", "reset-sorts"]);

defineProps({
  filters: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  roleOptions: { type: Array, default: () => [] },
});
</script>
