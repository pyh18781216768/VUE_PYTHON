<template>
  <div ref="chartRef" class="manufacturing-chart"></div>
</template>

<script setup>
import { BarChart, GaugeChart, LineChart, PieChart } from "echarts/charts";
import { GraphicComponent, GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { init, use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

use([
  BarChart,
  GaugeChart,
  LineChart,
  PieChart,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const props = defineProps({
  option: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["chart-click"]);

const chartRef = ref(null);
let chart = null;

function handleChartClick(params) {
  emit("chart-click", params);
}

function renderChart() {
  if (!chartRef.value) return;
  if (!chart) chart = init(chartRef.value);
  chart.setOption(props.option || {}, true);
  chart.off("click", handleChartClick);
  chart.on("click", handleChartClick);
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
  chart?.off("click", handleChartClick);
  chart?.dispose();
  chart = null;
});
</script>
