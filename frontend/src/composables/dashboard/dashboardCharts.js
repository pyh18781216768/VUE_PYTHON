import { formatDashboardMetric } from "@/composables/dashboard/dashboardFormatters";

export function createDashboardChartOptions({ categoryRows = [], metricFormat = "decimal", metricName = "", topRows = [], trendRows = [] }) {
  return {
    trend: createLineOption(trendRows, metricName, metricFormat),
    category: createBarOption(categoryRows.slice(0, 12), `${metricName} 分類對比`, metricFormat),
    top: createHorizontalBarOption(topRows, "TOP 風險組合", metricFormat),
  };
}

function createLineOption(rows, name, format) {
  return withBaseChartStyle({
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => formatDashboardMetric(value, format),
    },
    grid: { left: 44, right: 20, top: 28, bottom: 48 },
    xAxis: {
      type: "category",
      data: rows.map((row) => row.date),
      axisLabel: { color: "#a9c4d5", rotate: rows.length > 8 ? 30 : 0 },
    },
    yAxis: { type: "value", axisLabel: { color: "#a9c4d5", formatter: (value) => formatDashboardMetric(value, format) } },
    series: [
      {
        name,
        type: "line",
        smooth: true,
        symbolSize: 7,
        data: rows.map((row) => row.value),
        areaStyle: { color: "rgba(45, 212, 191, 0.14)" },
        lineStyle: { color: "#2dd4bf", width: 3 },
        itemStyle: { color: "#67e8f9" },
      },
    ],
  });
}

function createBarOption(rows, name, format) {
  return withBaseChartStyle({
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => formatDashboardMetric(value, format),
    },
    grid: { left: 44, right: 20, top: 28, bottom: 54 },
    xAxis: { type: "category", data: rows.map((row) => row.name), axisLabel: { color: "#a9c4d5", rotate: 25 } },
    yAxis: { type: "value", axisLabel: { color: "#a9c4d5", formatter: (value) => formatDashboardMetric(value, format) } },
    series: [
      {
        name,
        type: "bar",
        data: rows.map((row) => row.value),
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: "#38bdf8",
        },
      },
    ],
  });
}

function createHorizontalBarOption(rows, name, format) {
  return withBaseChartStyle({
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => formatDashboardMetric(value, format),
    },
    grid: { left: 128, right: 22, top: 26, bottom: 32 },
    xAxis: { type: "value", axisLabel: { color: "#a9c4d5", formatter: (value) => formatDashboardMetric(value, format) } },
    yAxis: {
      type: "category",
      data: rows.map((row) => row.name),
      axisLabel: { color: "#a9c4d5", overflow: "truncate", width: 112 },
    },
    series: [
      {
        name,
        type: "bar",
        data: rows.map((row) => row.value),
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: "#fb7185",
        },
      },
    ],
  });
}

function withBaseChartStyle(option) {
  return {
    backgroundColor: "transparent",
    textStyle: { color: "#dff8ff" },
    ...option,
  };
}
