<template>
  <section class="manufacturing-home">
    <p v-if="message" class="inline-message inline-error">{{ message }}</p>
    <p v-else-if="loading" class="inline-message inline-success">首頁資料載入中...</p>

    <section class="notice-ribbon">
      <div class="notice-title">
        <span class="notice-icon">◁</span>
        <div>
          <h2>公告 / 重點事件</h2>
          <p>重要通知 及時關注</p>
        </div>
      </div>
      <div class="notice-list">
        <div v-for="notice in notices" :key="notice.title" class="notice-row">
          <span class="notice-dot" :class="notice.level"></span>
          <strong :class="notice.level">【{{ notice.tag }}】</strong>
          <span>{{ notice.title }}</span>
          <time>{{ notice.time }}</time>
        </div>
      </div>
      <div class="wafer-visual" aria-hidden="true">
        <span></span>
      </div>
    </section>

    <main class="manufacturing-grid">
      <article class="neon-panel span-4">
        <ManufacturingPanelHeading number="1" title="OC 參數總覽" to="/oc" />
        <div class="production-layout">
          <div class="kpi-stack">
            <small>監控資料量</small>
            <strong>{{ formatNumber(ocSummary.totalInput || ocSummary.recordCount) }}</strong>
            <span>有效資料點 {{ formatNumber(ocSummary.pointCount) }} 筆</span>
            <b>達標率 {{ formatPercent(ocSummary.stableRate) }}</b>
            <em>平均風險 {{ formatMetric(ocSummary.averageSeverity) }}</em>
          </div>
          <ManufacturingChart :option="ocParameterOption" />
        </div>
      </article>

      <article class="neon-panel span-4">
        <ManufacturingPanelHeading number="2" title="任務分析" to="/frontend/tasks" />
        <div class="yield-layout">
          <div class="yield-kpis">
            <small>任務完成率</small>
            <strong>{{ formatPercent(taskSummary.completionRate) }}</strong>
            <span
              v-for="status in taskStatusItems"
              :key="`analysis-${status.name}`"
              class="task-status-chip"
              :class="taskStatusTone(status.name)"
              :style="taskStatusStyle(status.name)"
            >
              {{ status.name }} {{ formatNumber(status.value) }} 件
            </span>
          </div>
          <ManufacturingChart :option="taskAnalysisOption" @chart-click="openTasksByStatus" />
        </div>
      </article>

      <article class="neon-panel span-4">
        <ManufacturingPanelHeading number="3" title="Angle 參數總覽" to="/angle" />
        <div class="equipment-layout">
          <ul class="equipment-list">
            <li><span>監控參數</span><strong>{{ formatNumber(angleSummary.latestCount || angleSummary.recordCount) }}</strong></li>
            <li><span>合格項</span><strong class="good">{{ formatNumber(angleSummary.normalCount) }}</strong></li>
            <li><span>預警項</span><strong class="warn">{{ formatNumber(angleSummary.warningCount) }}</strong></li>
            <li><span>異常項</span><strong class="danger">{{ formatNumber(angleSummary.dangerCount) }}</strong></li>
          </ul>
          <ManufacturingChart :option="angleParameterOption" />
        </div>
      </article>

      <article class="neon-panel span-4">
        <ManufacturingPanelHeading number="4" title="Lens 參數總覽" to="/lens" />
        <div class="parameter-summary-layout">
          <div class="parameter-score-orb">
            <span>Lens</span>
            <strong>{{ formatPercent(lensSummary.stableRate) }}</strong>
            <small>整體穩定率</small>
          </div>
          <div class="parameter-table">
            <div v-for="metric in lensParameters" :key="metric.name" class="parameter-row">
              <b :class="metric.tone">{{ metric.status }}</b>
              <span>{{ metric.name }}</span>
              <strong>{{ metric.value }}</strong>
            </div>
          </div>
        </div>
      </article>

      <article class="neon-panel span-4">
        <ManufacturingPanelHeading number="5" title="任務進度" to="/frontend/tasks" />
        <div class="workorder-layout">
          <div class="workorder-kpis">
            <small>任務總數</small>
            <strong>{{ formatNumber(taskSummary.total) }}</strong>
            <span
              v-for="status in taskStatusItems"
              :key="`progress-${status.name}`"
              class="task-status-chip"
              :class="taskStatusTone(status.name)"
              :style="taskStatusStyle(status.name)"
            >
              {{ status.name }} {{ formatNumber(status.value) }}
            </span>
          </div>
          <ManufacturingChart :option="taskProgressOption" />
        </div>
      </article>

      <article class="neon-panel span-4">
        <ManufacturingPanelHeading number="6" title="製程趨勢" to="/oc" />
        <div class="trend-list">
          <div v-for="trend in trends" :key="trend.name" class="trend-row">
            <span>{{ trend.name }}</span>
            <div class="sparkline" :class="trend.tone">
              <i v-for="point in trend.points" :key="point" :style="{ height: `${point}%` }"></i>
            </div>
            <strong>{{ trend.value }}</strong>
            <em :class="trend.tone">{{ trend.delta }}</em>
          </div>
        </div>
      </article>
    </main>

    <footer class="manufacturing-footer">
      <span>數據更新時間：{{ formatDateTime(generatedAt) }}</span>
      <strong>CMA AA 先進製程 ｜ 智能製造 · 數據驅動 · 精益生產</strong>
      <span>服務狀態：<b>正常運行</b></span>
    </footer>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import ManufacturingChart from "@/components/dashboard/ManufacturingChart.vue";
import ManufacturingPanelHeading from "@/components/dashboard/ManufacturingPanelHeading.vue";
import {
  formatDateTime,
  formatMetric,
  formatNumber,
  formatPercent,
  useManufacturingHome,
} from "@/composables/useManufacturingHome";

const chartText = "#c7e9ff";
const chartGrid = "rgba(76, 196, 255, 0.12)";
const router = useRouter();
const taskStatusColorMap = {
  未开始: "#22d3ee",
  未開始: "#22d3ee",
  进行中: "#3b82f6",
  進行中: "#3b82f6",
  待审核: "#ffa936",
  待審核: "#ffa936",
  已完成: "#42e781",
  已驳回: "#ff5d66",
  已駁回: "#ff5d66",
};
const taskStatusColorPalette = ["#22d3ee", "#3b82f6", "#ffa936", "#42e781", "#ff5d66", "#a78bfa", "#f472b6"];

const {
  angleSummary,
  generatedAt,
  lensSummary,
  loading,
  message,
  notices,
  ocSummary,
  taskSummary,
} = useManufacturingHome();

const lensParameters = computed(() => {
  const rows = lensSummary.value.topItems || [];
  if (rows.length) {
    return rows.map((row) => ({
      ...row,
      value: row.displayValue || row.value || "--",
    }));
  }
  return [{ tone: "low", status: "無資料", name: "Lens 參數", value: "--" }];
});

const taskStatusItems = computed(() => {
  const items = taskSummary.value.statusItems || [];
  return items.filter((item) => Number(item.value || 0) > 0);
});

const taskStatusQueryMap = {
  未開始: "未开始",
  進行中: "进行中",
  待審核: "待审核",
  已駁回: "已驳回",
};

const trends = computed(() => [
  createParameterTrendRow("OC 達標率", ocSummary.value),
  createParameterTrendRow("Angle 達標率", angleSummary.value),
  createParameterTrendRow("Lens 達標率", lensSummary.value),
  createTaskTrendRow(),
]);

const ocParameterOption = computed(() => {
  const trend = ocSummary.value.trend || [];
  const dates = trend.map((item) => shortDate(item.date));
  return {
  color: ["#16d4ff", "#1575ff"],
  tooltip: { trigger: "axis" },
  legend: { right: 8, top: 0, textStyle: { color: chartText }, itemWidth: 12, itemHeight: 7 },
  grid: { left: 38, right: 14, top: 42, bottom: 26 },
  xAxis: {
    type: "category",
    data: dates,
    axisLabel: { color: chartText },
    axisLine: { lineStyle: { color: chartGrid } },
  },
  yAxis: {
    type: "value",
    axisLabel: { color: chartText },
    splitLine: { lineStyle: { color: chartGrid } },
  },
  series: [
    { name: "OC 達標率", type: "bar", barWidth: 12, data: trend.map((item) => Number(item.stableRate || 0)) },
    { name: "目標線", type: "bar", barWidth: 12, data: trend.map(() => 95) },
  ],
  };
});

const taskAnalysisOption = computed(() => {
  const items = taskStatusItems.value;
  const chartItems = items.length ? items : [{ name: "暫無任務", value: 1 }];
  const valueMap = Object.fromEntries(chartItems.map((item) => [item.name, item.value]));
  return {
  color: chartItems.map((item) => getTaskStatusColor(item.name)),
  tooltip: { trigger: "item" },
  legend: {
    orient: "vertical",
    right: 4,
    top: "center",
    textStyle: { color: chartText },
    formatter: (name) => {
      return `${name}    ${valueMap[name] ?? 0}`;
    },
  },
  series: [
    {
      type: "pie",
      radius: ["48%", "70%"],
      center: ["38%", "52%"],
      label: { show: false },
      data: chartItems.map((item) => ({
        ...item,
        taskStatus: normalizeTaskStatus(item.name),
      })),
    },
  ],
  graphic: {
    type: "text",
    left: "30%",
    top: "47%",
    style: {
      text: `${formatNumber(taskSummary.value.total)}\n任務總數`,
      fill: "#e8f7ff",
      fontSize: 18,
      fontWeight: 900,
      textAlign: "center",
    },
  },
  };
});

const angleParameterOption = computed(() => ({
  series: [
    {
      type: "gauge",
      min: 0,
      max: 100,
      radius: "92%",
      center: ["52%", "58%"],
      progress: { show: true, width: 12, itemStyle: { color: "#23d7ff" } },
      axisLine: {
        lineStyle: {
          width: 12,
          color: [
            [0.68, "#27d17f"],
            [0.85, "#ffad33"],
            [1, "#ff5353"],
          ],
        },
      },
      splitLine: { distance: 2, length: 10, lineStyle: { color: "#88dfff" } },
      axisTick: { distance: 2, lineStyle: { color: "#37c7ff" } },
      axisLabel: { color: chartText, distance: 16 },
      pointer: { width: 5, itemStyle: { color: "#71d4ff" } },
      detail: { valueAnimation: true, formatter: "{value}%\nAngle 穩定率", color: "#e8f7ff", fontSize: 22, fontWeight: 900 },
      data: [{ value: Number(angleSummary.value.stableRate || 0) }],
    },
  ],
}));

const taskProgressOption = computed(() => {
  const progress = taskSummary.value.progress || [];
  const statuses = taskStatusItems.value;
  return {
  color: statuses.map((item) => getTaskStatusColor(item.name)),
  tooltip: { trigger: "axis" },
  legend: { top: 0, right: 4, textStyle: { color: chartText }, itemWidth: 12, itemHeight: 7 },
  grid: { left: 36, right: 12, top: 42, bottom: 24 },
  xAxis: {
    type: "category",
    data: progress.map((item) => shortDate(item.date)),
    axisLabel: { color: chartText },
    axisLine: { lineStyle: { color: chartGrid } },
  },
  yAxis: {
    type: "value",
    axisLabel: { color: chartText },
    splitLine: { lineStyle: { color: chartGrid } },
  },
  series: [
    ...statuses.map((status) => ({
      name: status.name,
      type: "line",
      smooth: true,
      data: progress.map((item) => Number((item.statusCounts || {})[status.name] || 0)),
    })),
  ],
  };
});

function shortDate(value) {
  const text = String(value || "");
  return text.length >= 10 ? text.slice(5, 10) : text || "--";
}

function openTasksByStatus(params) {
  const status = normalizeTaskStatus(params?.data?.taskStatus || params?.name);
  if (!status || status === "暫無任務") return;
  router.push({
    path: "/frontend/tasks",
    query: { status },
  });
}

function normalizeTaskStatus(status) {
  const text = String(status || "").trim();
  return taskStatusQueryMap[text] || text;
}

function createParameterTrendRow(name, summary) {
  const trend = summary.trend || [];
  const stableRates = trend.map((item) => Number(item.stableRate || 0));
  const current = Number(summary.stableRate || 0);
  const previous = stableRates.length > 1 ? stableRates[stableRates.length - 2] : current;
  const delta = current - previous;
  return {
    name,
    value: formatPercent(current),
    delta: `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)}pp`,
    tone: delta >= 0 ? "good" : "danger",
    points: normalizeSparkline(stableRates),
  };
}

function createTaskTrendRow() {
  const progress = taskSummary.value.progress || [];
  const totals = progress.map((item) =>
    Object.values(item.statusCounts || {}).reduce((sum, value) => sum + Number(value || 0), 0),
  );
  const completionRates = progress.map((item, index) => {
    const total = totals[index] || 0;
    return total ? (Number((item.statusCounts || {})["已完成"] || 0) / total) * 100 : 0;
  });
  const current = Number(taskSummary.value.completionRate || 0);
  const previous = completionRates.length > 1 ? completionRates[completionRates.length - 2] : current;
  const delta = current - previous;
  return {
    name: "任務完成率",
    value: formatPercent(current),
    delta: `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)}pp`,
    tone: delta >= 0 ? "good" : "danger",
    points: normalizeSparkline(completionRates),
  };
}

function normalizeSparkline(values) {
  if (!values.length) return [8, 8, 8, 8, 8, 8, 8];
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  return values.map((value) => Math.max(10, Math.round(((value - min) / range) * 70 + 18)));
}

function getTaskStatusColor(status) {
  if (taskStatusColorMap[status]) return taskStatusColorMap[status];
  const text = String(status || "");
  const hash = [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return taskStatusColorPalette[hash % taskStatusColorPalette.length] || "#8fb8ff";
}

function taskStatusTone(status) {
  if (status === "已完成") return "good";
  if (status === "待审核" || status === "待審核") return "warn";
  if (status === "已驳回" || status === "已駁回") return "danger";
  return "";
}

function taskStatusStyle(status) {
  const color = getTaskStatusColor(status);
  return {
    "--task-status-color": color,
    "--task-status-bg": `${color}24`,
  };
}

</script>
