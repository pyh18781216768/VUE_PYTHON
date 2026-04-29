<template>
  <div class="dashboard-chart-grid">
    <DashboardChart title="趨勢圖" subtitle="按日期彙總目前篩選條件下的指標。" :option="options.trend" />
    <DashboardChart title="分類對比" subtitle="按參數分類彙總目前快照。" :option="options.category" />
    <DashboardChart title="TOP 風險組合" subtitle="按目前快照風險值排序。" :option="options.top" />
  </div>
</template>

<script setup>
import DashboardChart from "@/components/dashboard/DashboardChart.vue";

defineProps({
  options: { type: Object, default: () => ({ trend: {}, category: {}, top: {} }) },
});
</script>
