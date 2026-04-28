<template>
  <article class="content-panel dashboard-chart-card">
    <div class="panel-title-row">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <div ref="chartRef" class="dashboard-chart"></div>
  </article>
</template>

<script setup>
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { init, use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

use([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps({
  option: { type: Object, default: () => ({}) },
  subtitle: { type: String, default: "" },
  title: { type: String, required: true },
});

const chartRef = ref(null);
let chart = null;

function renderChart() {
  if (!chartRef.value) return;
  if (!chart) chart = init(chartRef.value);
  chart.setOption(props.option || {}, true);
}

function resizeChart() {
  chart?.resize();
}

onMounted(async () => {
  await nextTick();
  renderChart();
  window.addEventListener("resize", resizeChart);
});

watch(
  () => props.option,
  async () => {
    await nextTick();
    renderChart();
  },
  { deep: true },
);

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeChart);
  chart?.dispose();
  chart = null;
});
</script>
