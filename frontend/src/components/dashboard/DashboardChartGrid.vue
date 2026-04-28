<template>
  <div class="dashboard-chart-grid">
    <DashboardChart title="趋势图" subtitle="按日期聚合当前筛选条件下的指标。" :option="options.trend" />
    <DashboardChart title="分类对比" subtitle="按参数分类聚合当前快照。" :option="options.category" />
    <DashboardChart title="TOP 风险组合" subtitle="按当前快照风险值排序。" :option="options.top" />
  </div>
</template>

<script setup>
import DashboardChart from "@/components/dashboard/DashboardChart.vue";

defineProps({
  options: { type: Object, default: () => ({ trend: {}, category: {}, top: {} }) },
});
</script>
