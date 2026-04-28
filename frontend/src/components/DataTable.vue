<template>
  <div class="data-table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">
            <button
              v-if="column.sortable"
              class="data-table-sort"
              type="button"
              @click="$emit('sort-change', column.key, $event)"
            >
              <span>{{ column.label }}</span>
              <span>{{ getSortIndicator(column.key) }}</span>
            </button>
            <span v-else>{{ column.label }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIndex) in rows"
          :key="row[rowKey] ?? rowIndex"
          @dblclick="$emit('row-dblclick', row)"
        >
          <td v-for="column in columns" :key="column.key">
            <slot :name="`cell-${column.key}`" :row="row" :value="getValue(row, column.key)">
              {{ formatCell(row, column) }}
            </slot>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td class="data-table-empty" :colspan="columns.length || 1">
            {{ emptyText }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineEmits(["row-dblclick", "sort-change"]);

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: "id" },
  emptyText: { type: String, default: "暂无数据" },
  sorts: { type: Array, default: () => [] },
});

function getValue(row, key) {
  return String(key)
    .split(".")
    .reduce((value, part) => (value && value[part] !== undefined ? value[part] : undefined), row);
}

function formatCell(row, column) {
  const value = getValue(row, column.key);
  if (typeof column.formatter === "function") return column.formatter(value, row);
  if (value === null || value === undefined || value === "") return "--";
  return value;
}

function getSortIndicator(key) {
  const index = props.sorts.findIndex((item) => item.key === key);
  if (index < 0) return "";
  const sort = props.sorts[index];
  const mark = sort.direction === "asc" ? "▲" : "▼";
  return props.sorts.length > 1 ? `${mark}${index + 1}` : mark;
}
</script>
