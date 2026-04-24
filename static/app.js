(function () {
  const { createApp, computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } = Vue;

  const AUTH_REQUIRED_ERROR = "__AUTH_REQUIRED__";
  const ACTIVE_PAGE_STORAGE_KEY = "fab_dashboard_active_page";
  const ACTIVE_SYSTEM_STORAGE_KEY = "fab_active_system_mode";
  const THRESHOLD_STORAGE_PREFIX = "fab_dashboard_thresholds_";
  const DASHBOARD_THUMBNAILS_PER_PAGE = 12;

  const ROUTES = {
    home: "/",
    login: "/login",
    angle: "/angle",
    oc: "/oc",
    lens: "/lens",
  };

  const RISK_COLORS = {
    green: "#2dd4bf",
    yellow: "#fbbf24",
    red: "#f87171",
    neutral: "#c7dced",
  };

  const CHART_TEXT = "#edf7ff";
  const CHART_MUTED = "#c7dced";
  const CHART_AXIS = "rgba(199, 220, 237, 0.34)";
  const CHART_SPLIT = "rgba(199, 220, 237, 0.14)";
  const CHART_TOOLTIP_BG = "rgba(5, 16, 30, 0.96)";

  const PAGE_CONFIGS = {
    angle: {
      key: "angle",
      route: ROUTES.angle,
      navLabel: "Angle",
      navCaption: "ANGLE",
      heroTitle: "Angle Yield Command Center",
      heroDescription: "聚焦 X/Y 角度超规率、投入变化和高风险站点。",
      chartMetricLabel: "加权超规率",
      categoryLabel: "Angle",
      categoryChartTitle: "Angle 最新对比",
      categoryChartDescription: "按 Angle 类别比较当前快照的加权超规率。",
      topChartTitle: "TOP 10 高风险站点",
      topChartDescription: "按当前快照超规率排序。",
      trendChartTitle: "超规率与投入趋势",
      trendChartDescription: "趋势图同时显示投入量和阈值线。",
      overviewMetricLabel: "加权超规率",
      overviewExtraLabel: "Fail 总数",
      summaryTitle: "Angle 快照汇总",
      summaryDescription: "当前快照下各 Angle 的风险等级。",
      detailTitle: "Angle 明细",
      detailDescription: "展示当前快照记录，点击表头可排序。",
      sourceTitle: "数据库表状态",
      sourceDescription: "当前页面直接读取的数据表。",
      metricFormat: "percent",
      thresholdMode: "percent",
      filters: [
        { key: "source", label: "数据源", optionsKey: "sources" },
        { key: "category", label: "Angle", optionsKey: "categories" },
        { key: "project", label: "Project", optionsKey: "projects" },
        { key: "vendor", label: "Vendor", optionsKey: "vendors" },
        { key: "aaMC", label: "AA MC", optionsKey: "aaMCs" },
        { key: "stn", label: "STN", optionsKey: "stations" },
        { key: "snapshotDate", label: "快照日期", optionsKey: "dateLabels", latestLabel: "最新数据" },
      ],
      detailColumns: [
        { key: "source", label: "Source", format: "text" },
        { key: "category", label: "Angle", format: "text" },
        { key: "project", label: "Project", format: "text" },
        { key: "vendor", label: "Vendor", format: "text" },
        { key: "aaMC", label: "AA MC", format: "text" },
        { key: "stn", label: "STN", format: "text" },
        { key: "date", label: "日期", format: "text" },
        { key: "metricValue", label: "超规率", format: "percent", risk: true },
        { key: "failCount", label: "Fail", format: "integer" },
        { key: "inputCount", label: "投入数", format: "integer" },
      ],
      exportColumns: [
        { key: "source", label: "Source" },
        { key: "category", label: "Angle" },
        { key: "project", label: "Project" },
        { key: "vendor", label: "Vendor" },
        { key: "aaMC", label: "AA MC" },
        { key: "stn", label: "STN" },
        { key: "date", label: "日期" },
        { key: "metricValue", label: "超规率" },
        { key: "failCount", label: "Fail" },
        { key: "inputCount", label: "投入数" },
      ],
    },
    oc: {
      key: "oc",
      route: ROUTES.oc,
      navLabel: "OC 系列",
      navCaption: "OC",
      heroTitle: "OC Series Command Center",
      heroDescription: "聚焦绝对偏移、投入变化和异常站点。",
      chartMetricLabel: "加权绝对 OC",
      categoryLabel: "Series",
      categoryChartTitle: "OC 系列最新对比",
      categoryChartDescription: "按 OC_X / OC_Y 比较当前快照的加权绝对偏移。",
      topChartTitle: "TOP 10 最大偏移项目",
      topChartDescription: "按当前快照 |OC| 排序。",
      trendChartTitle: "绝对 OC 与投入趋势",
      trendChartDescription: "趋势图展示加权绝对 OC 与投入量。",
      overviewMetricLabel: "加权绝对 OC",
      overviewExtraLabel: "最大 |OC|",
      summaryTitle: "OC 系列汇总",
      summaryDescription: "当前快照下各 OC 系列的偏移等级。",
      detailTitle: "OC 明细",
      detailDescription: "展示当前快照记录，包含原始 OC 值与绝对值。",
      sourceTitle: "数据库表状态",
      sourceDescription: "当前页面直接读取的数据表。",
      metricFormat: "decimal",
      thresholdMode: "number",
      filters: [
        { key: "source", label: "数据源", optionsKey: "sources" },
        { key: "category", label: "Series", optionsKey: "categories" },
        { key: "project", label: "Project", optionsKey: "projects" },
        { key: "aaMC", label: "AA MC", optionsKey: "aaMCs" },
        { key: "stn", label: "STN", optionsKey: "stations" },
        { key: "snapshotDate", label: "快照日期", optionsKey: "dateLabels", latestLabel: "最新数据" },
      ],
      detailColumns: [
        { key: "source", label: "Source", format: "text" },
        { key: "category", label: "Series", format: "text" },
        { key: "project", label: "Project", format: "text" },
        { key: "aaMC", label: "AA MC", format: "text" },
        { key: "stn", label: "STN", format: "text" },
        { key: "date", label: "日期", format: "text" },
        { key: "metricValue", label: "OC 值", format: "signedDecimal" },
        { key: "severityValue", label: "|OC|", format: "decimal", risk: true },
        { key: "inputCount", label: "投入数", format: "integer" },
      ],
      exportColumns: [
        { key: "source", label: "Source" },
        { key: "category", label: "Series" },
        { key: "project", label: "Project" },
        { key: "aaMC", label: "AA MC" },
        { key: "stn", label: "STN" },
        { key: "date", label: "日期" },
        { key: "metricValue", label: "OC 值" },
        { key: "severityValue", label: "|OC|" },
        { key: "inputCount", label: "投入数" },
      ],
    },
    lens: {
      key: "lens",
      route: ROUTES.lens,
      navLabel: "Lens 系列",
      navCaption: "LENS",
      heroTitle: "Lens Series Command Center",
      heroDescription: "聚焦 Fail Rate、Config 分布和高风险组合。",
      chartMetricLabel: "加权 Fail Rate",
      categoryLabel: "Lens PP",
      categoryChartTitle: "Lens PP 最新对比",
      categoryChartDescription: "按 Lens PP 比较当前快照的加权 Fail Rate。",
      topChartTitle: "TOP 10 高风险组合",
      topChartDescription: "按当前快照 Fail Rate 排序。",
      trendChartTitle: "Fail Rate 与投入趋势",
      trendChartDescription: "趋势图展示加权 Fail Rate 与投入量。",
      overviewMetricLabel: "加权 Fail Rate",
      overviewExtraLabel: "Fail 总数",
      summaryTitle: "Lens PP 汇总",
      summaryDescription: "当前快照下各 Lens PP 的风险等级。",
      detailTitle: "Lens 明细",
      detailDescription: "展示当前快照记录，包含 Config、AA Time 和 Fail Rate。",
      sourceTitle: "数据库表状态",
      sourceDescription: "当前页面直接读取的数据表。",
      metricFormat: "percent",
      thresholdMode: "percent",
      filters: [
        { key: "source", label: "数据源", optionsKey: "sources" },
        { key: "category", label: "Lens PP", optionsKey: "categories" },
        { key: "config", label: "Config", optionsKey: "configs" },
        { key: "project", label: "Project", optionsKey: "projects" },
        { key: "aaMC", label: "AA MC", optionsKey: "aaMCs" },
        { key: "aaTime", label: "AA Time", optionsKey: "aaTimes" },
        { key: "snapshotDate", label: "快照日期", optionsKey: "dateLabels", latestLabel: "最新数据" },
      ],
      detailColumns: [
        { key: "source", label: "Source", format: "text" },
        { key: "category", label: "Lens PP", format: "text" },
        { key: "config", label: "Config", format: "text" },
        { key: "project", label: "Project", format: "text" },
        { key: "aaMC", label: "AA MC", format: "text" },
        { key: "aaTime", label: "AA Time", format: "text" },
        { key: "date", label: "Test Time", format: "text" },
        { key: "metricValue", label: "Fail Rate", format: "percent", risk: true },
        { key: "failCount", label: "Fail", format: "integer" },
        { key: "inputCount", label: "投入数", format: "integer" },
      ],
      exportColumns: [
        { key: "source", label: "Source" },
        { key: "category", label: "Lens PP" },
        { key: "config", label: "Config" },
        { key: "project", label: "Project" },
        { key: "aaMC", label: "AA MC" },
        { key: "aaTime", label: "AA Time" },
        { key: "date", label: "Test Time" },
        { key: "metricValue", label: "Fail Rate" },
        { key: "failCount", label: "Fail" },
        { key: "inputCount", label: "投入数" },
      ],
    },
  };

  const createEmptyDashboard = () => ({
    page: "angle",
    title: "",
    generatedAt: "",
    databasePath: "",
    recordCount: 0,
    pointCount: 0,
    tableCount: 0,
    databaseRowCount: 0,
    latestAvailableDate: "",
    metricFormat: "percent",
    thresholds: { yellow: 0.1, red: 0.3, mode: "percent" },
    dimensions: {
      sources: [],
      categories: [],
      projects: [],
      vendors: [],
      aaMCs: [],
      stations: [],
      configs: [],
      aaTimes: [],
      dateLabels: [],
    },
    tables: [],
    records: [],
  });

  const createEmptyTaskSystem = () => ({
    currentUser: null,
    users: [],
    shifts: [],
    settings: {},
    handovers: [],
    tasks: [],
    reports: {
      handoverCount: 0,
      taskCount: 0,
      completedTaskCount: 0,
      openTaskCount: 0,
      tasksByStatus: {},
      handoversByShift: {},
    },
    reminders: {
      dueTasks: [],
      shiftReminders: [],
    },
    statusOptions: ["未开始", "进行中", "已完成"],
    priorityOptions: ["低", "中", "高"],
  });

  const DETAIL_TIMELINE_MODE_CATALOG = {
    rate: { key: "rate", label: "Rate", suffix: "Rate", format: "percent", risk: true, valueType: "metric" },
    value: {
      key: "value",
      label: "Value",
      suffix: "Value",
      format: "signedDecimal",
      risk: true,
      valueType: "metric",
    },
    input: { key: "input", label: "Input", suffix: "Input", format: "integer", risk: false, valueType: "input" },
    fail: { key: "fail", label: "Fail", suffix: "Fail", format: "integer", risk: false, valueType: "fail" },
  };

  const DETAIL_TIMELINE_MODES_BY_PAGE = {
    angle: ["rate", "input", "fail"],
    oc: ["value", "input"],
    lens: ["rate", "input", "fail"],
  };

  function getDetailModeOptionsForPage(page) {
    const modeKeys = DETAIL_TIMELINE_MODES_BY_PAGE[page] || DETAIL_TIMELINE_MODES_BY_PAGE.angle;
    return modeKeys.map((key) => DETAIL_TIMELINE_MODE_CATALOG[key]).filter(Boolean);
  }

  function getDefaultDetailMode(page) {
    return getDetailModeOptionsForPage(page)[0]?.key || "rate";
  }

  function getDefaultThresholdCompareMode(page) {
    return PAGE_CONFIGS[page]?.thresholdMode === "number" ? "absolute" : "direct";
  }

  function parseDashboardDate(value) {
    if (!value) return null;
    const normalized = String(value).trim().replace(/\//g, "-");
    const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!match) return null;
    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function addDays(date, offset) {
    const next = new Date(date);
    next.setDate(next.getDate() + offset);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  function addMonths(date, offset) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + offset, 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function startOfIsoWeek(date) {
    const next = new Date(date);
    const day = next.getDay() || 7;
    next.setDate(next.getDate() - day + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  function getIsoWeekParts(date) {
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
    return {
      year: target.getUTCFullYear(),
      week,
    };
  }

  function formatDayKey(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function formatMonthKey(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${date.getFullYear()}-${month}`;
  }

  function createTimelineAggregate() {
    return {
      pointCount: 0,
      totalInput: 0,
      totalFail: 0,
      metricSum: 0,
      metricCount: 0,
      metricWeightedTotal: 0,
      metricInputTotal: 0,
    };
  }

  function pushAggregateValue(bucket, point) {
    const inputCount = point.inputCount === null || point.inputCount === undefined ? null : Number(point.inputCount);
    const failCount = point.failCount === null || point.failCount === undefined ? null : Number(point.failCount);
    const metricValue = point.metricValue === null || point.metricValue === undefined ? null : Number(point.metricValue);

    bucket.pointCount += 1;

    if (Number.isFinite(inputCount)) {
      bucket.totalInput += inputCount;
    }
    if (Number.isFinite(failCount)) {
      bucket.totalFail += failCount;
    }
    if (Number.isFinite(metricValue)) {
      bucket.metricSum += metricValue;
      bucket.metricCount += 1;
      if (Number.isFinite(inputCount) && inputCount > 0) {
        bucket.metricWeightedTotal += metricValue * inputCount;
        bucket.metricInputTotal += inputCount;
      }
    }
  }

  function buildTimelineAggregates(values) {
    const months = new Map();
    const weeks = new Map();
    const days = new Map();

    for (const point of values || []) {
      const parsedDate = parseDashboardDate(point.date);
      if (!parsedDate) continue;

      const monthKey = formatMonthKey(parsedDate);
      const isoWeek = getIsoWeekParts(parsedDate);
      const weekKey = `${isoWeek.year}-W${String(isoWeek.week).padStart(2, "0")}`;
      const dayKey = formatDayKey(parsedDate);

      if (!months.has(monthKey)) months.set(monthKey, createTimelineAggregate());
      if (!weeks.has(weekKey)) weeks.set(weekKey, createTimelineAggregate());
      if (!days.has(dayKey)) days.set(dayKey, createTimelineAggregate());

      pushAggregateValue(months.get(monthKey), point);
      pushAggregateValue(weeks.get(weekKey), point);
      pushAggregateValue(days.get(dayKey), point);
    }

    return { months, weeks, days };
  }

  function resolveTimelineMetricValue(bucket, modeConfig) {
    if (!bucket || !bucket.pointCount) return null;
    if (!modeConfig) return null;
    if (modeConfig.valueType === "input") return bucket.totalInput;
    if (modeConfig.valueType === "fail") return bucket.totalFail;
    if (bucket.metricInputTotal > 0) return bucket.metricWeightedTotal / bucket.metricInputTotal;
    if (bucket.metricCount > 0) return bucket.metricSum / bucket.metricCount;
    return null;
  }

  function buildTimelineColumns(referenceDate, modeConfig) {
    if (!referenceDate) return [];

    const resolvedModeConfig = modeConfig || DETAIL_TIMELINE_MODE_CATALOG.rate;
    const columns = [];
    const referenceMonthStart = startOfMonth(referenceDate);
    const referenceWeekStart = startOfIsoWeek(referenceDate);

    for (const offset of [2, 1]) {
      const monthDate = addMonths(referenceMonthStart, -offset);
      columns.push({
        key: `timeline:month:${formatMonthKey(monthDate)}`,
        label: `${monthDate.getMonth() + 1}月${resolvedModeConfig.suffix}`,
        format: resolvedModeConfig.format,
        risk: resolvedModeConfig.risk,
        riskCompareMode: resolvedModeConfig.risk ? "follow-setting" : null,
        columnClass: "detail-col-time",
        timelineType: "month",
        timelineId: formatMonthKey(monthDate),
      });
    }

    for (const offset of [4, 3, 2, 1]) {
      const weekDate = addDays(referenceWeekStart, offset * -7);
      const isoWeek = getIsoWeekParts(weekDate);
      columns.push({
        key: `timeline:week:${isoWeek.year}-W${String(isoWeek.week).padStart(2, "0")}`,
        label: `wk${isoWeek.week}${resolvedModeConfig.suffix}`,
        format: resolvedModeConfig.format,
        risk: resolvedModeConfig.risk,
        riskCompareMode: resolvedModeConfig.risk ? "follow-setting" : null,
        columnClass: "detail-col-time",
        timelineType: "week",
        timelineId: `${isoWeek.year}-W${String(isoWeek.week).padStart(2, "0")}`,
      });
    }

    for (let offset = 9; offset >= 0; offset -= 1) {
      const dayDate = addDays(referenceDate, -offset);
      columns.push({
        key: `timeline:day:${formatDayKey(dayDate)}`,
        label: `${dayDate.getMonth() + 1}-${dayDate.getDate()}${resolvedModeConfig.suffix}`,
        format: resolvedModeConfig.format,
        risk: resolvedModeConfig.risk,
        riskCompareMode: resolvedModeConfig.risk ? "follow-setting" : null,
        columnClass: "detail-col-time",
        timelineType: "day",
        timelineId: formatDayKey(dayDate),
      });
    }

    return columns;
  }

  const SearchableSelect = {
    props: {
      modelValue: { type: [String, Number], default: "" },
      options: { type: Array, default: () => [] },
      placeholder: { type: String, default: "搜索或选择" },
      emptyLabel: { type: String, default: "" },
      allowEmpty: { type: Boolean, default: true },
      disabled: { type: Boolean, default: false },
    },
    emits: ["update:modelValue"],
    setup(props, { emit }) {
      const root = ref(null);
      const query = ref("");
      const open = ref(false);

      const normalizedOptions = computed(() => {
        const items = props.options.map((item) => {
          if (typeof item === "object" && item !== null) {
            const value = item.value ?? "";
            return { value: String(value), label: String(item.label ?? value) };
          }
          return { value: String(item ?? ""), label: String(item ?? "") };
        });
        return props.allowEmpty ? [{ value: "", label: props.emptyLabel || "全部" }, ...items] : items;
      });

      const selectedOption = computed(() =>
        normalizedOptions.value.find((item) => item.value === String(props.modelValue ?? ""))
      );

      const filteredOptions = computed(() => {
        const keyword = query.value.trim().toLowerCase();
        if (!keyword) return normalizedOptions.value;
        return normalizedOptions.value.filter((item) =>
          `${item.label} ${item.value}`.toLowerCase().includes(keyword)
        );
      });

      watch(
        () => props.modelValue,
        () => {
          query.value = selectedOption.value?.label || "";
        },
        { immediate: true }
      );

      function choose(option) {
        emit("update:modelValue", option.value);
        query.value = option.label;
        open.value = false;
      }

      function handleInput(event) {
        query.value = event.target.value;
        open.value = true;
        if (!query.value && props.allowEmpty) {
          emit("update:modelValue", "");
        }
      }

      function handleFocus() {
        query.value = "";
        open.value = true;
      }

      function selectFirst() {
        const [first] = filteredOptions.value;
        if (first) choose(first);
      }

      function close() {
        open.value = false;
        query.value = selectedOption.value?.label || "";
      }

      function clearValue() {
        choose({ value: "", label: props.emptyLabel || "全部" });
      }

      function handleDocumentClick(event) {
        if (!root.value || root.value.contains(event.target)) return;
        close();
      }

      onMounted(() => document.addEventListener("click", handleDocumentClick));
      onBeforeUnmount(() => document.removeEventListener("click", handleDocumentClick));

      return { root, query, open, filteredOptions, choose, handleFocus, handleInput, selectFirst, close, clearValue };
    },
    template: `
      <div class="searchable-select" ref="root">
        <input
          class="searchable-select-input"
          type="text"
          :value="query"
          :placeholder="placeholder"
          :disabled="disabled"
          autocomplete="off"
          @focus="handleFocus"
          @input="handleInput"
          @keydown.enter.prevent="selectFirst"
          @keydown.esc.prevent="close"
        />
        <button
          v-if="allowEmpty && modelValue"
          class="searchable-select-clear"
          type="button"
          aria-label="清空"
          @click.stop="clearValue"
        >
          ×
        </button>
        <div v-if="open" class="searchable-select-menu">
          <button
            v-for="item in filteredOptions"
            :key="item.value + ':' + item.label"
            type="button"
            :class="['searchable-select-option', { active: String(modelValue ?? '') === item.value }]"
            @click.stop="choose(item)"
          >
            {{ item.label }}
          </button>
          <div v-if="!filteredOptions.length" class="searchable-select-empty">无匹配选项</div>
        </div>
      </div>
    `,
  };

  createApp({
    components: { SearchableSelect },
    setup() {
      const chartRefs = { trend: null, category: null, top: null };

      const authChecking = ref(true);
      const isAuthenticated = ref(false);
      const authMessage = ref("");
      const authUser = ref({
        username: "",
        displayName: "",
        displayLabel: "",
        department: "",
        email: "",
        phone: "",
        updatedAt: "",
      });

      const loginSubmitting = ref(false);
      const loading = ref(true);
      const error = ref("");
      const navDrawerOpen = ref(false);

      const profileDialogOpen = ref(false);
      const profileSaving = ref(false);
      const profileMessage = ref("");
      const profileMessageTone = ref("error");

      const exportDialogOpen = ref(false);
      const exportSubmitting = ref(false);
      const exportMessage = ref("");
      const exportMessageTone = ref("error");

      const loginForm = reactive({
        username: "",
        password: "",
      });

      const profileForm = reactive({
        username: "",
        displayName: "",
        department: "",
        email: "",
        phone: "",
        newPassword: "",
        confirmPassword: "",
      });

      const systemMode = ref(window.localStorage.getItem(ACTIVE_SYSTEM_STORAGE_KEY) || "tasks");
      const taskSection = ref("handover");
      const activePage = ref(getPageFromPath(window.location.pathname));
      const dashboard = ref(createEmptyDashboard());
      const taskSystem = ref(createEmptyTaskSystem());
      const taskSystemLoading = ref(false);
      const taskSystemError = ref("");
      const filters = reactive({});
      const thresholds = reactive({ yellow: 0, red: 0, compareMode: "direct" });
      const detailSort = reactive([{ field: "severityValue", direction: "desc" }]);
      const detailMode = ref("rate");
      const exportForm = reactive({
        filters: {},
        columns: [],
      });
      const dashboardPreviewSearch = ref("");
      const dashboardGalleryView = ref("grid");
      const dashboardGalleryPage = ref(1);
      const selectedDashboardThumbnailKey = ref("");
      const chartDateFilter = reactive({
        mode: "range",
        singleDate: "",
        startDate: "",
        endDate: "",
      });
      const chartSettings = reactive({
        trend: {
          xAxisLabel: "日期",
          yAxisLabel: "指标",
          secondaryYAxisLabel: "投入数",
          xAxisRotate: 0,
        },
        category: {
          xAxisLabel: "指标",
          yAxisLabel: "分类",
          xAxisRotate: 0,
        },
        top: {
          xAxisLabel: "指标",
          yAxisLabel: "对象",
          xAxisRotate: 0,
        },
      });

      const handoverFilters = reactive({
        keyword: "",
        dateFrom: "",
        dateTo: "",
        shiftGroupId: "",
        handoverUser: "",
        receiverUser: "",
      });
      const taskFilters = reactive({
        keyword: "",
        status: "",
        assigneeUser: "",
      });
      const handoverForm = reactive({
        id: "",
        title: "",
        shiftGroupId: "",
        recordTime: "",
        handoverUser: "",
        receiverUser: "",
        workSummary: "",
        precautions: "",
        pendingItems: "",
        keywords: "",
      });
      const taskForm = reactive({
        id: "",
        title: "",
        description: "",
        status: "未开始",
        priority: "中",
        dueAt: "",
        assigneeUser: "",
        handoverRecordId: "",
        reminderAt: "",
      });
      const userForm = reactive({
        username: "",
        displayName: "",
        department: "",
        email: "",
        phone: "",
        role: "user",
        isActive: true,
        shiftGroupId: "",
        password: "",
      });
      const shiftForm = reactive({
        id: "",
        name: "",
        startTime: "08:00",
        endTime: "16:00",
        sortOrder: 0,
        isActive: true,
      });
      const settingsForm = reactive({
        "notifications.handover_minutes": 30,
        "notifications.task_due_hours": 24,
        "permissions.assign_admin": true,
      });
      const handoverFiles = ref([]);
      const taskFiles = ref([]);
      const taskActionSubmitting = ref(false);
      const taskActionMessage = ref("");
      const taskActionTone = ref("error");

      const pageConfig = computed(() => PAGE_CONFIGS[activePage.value] || PAGE_CONFIGS.angle);
      const isAdmin = computed(() => (authUser.value.role || "") === "admin");
      const activeSystemLoading = computed(() =>
        systemMode.value === "tasks" ? taskSystemLoading.value : loading.value
      );
      const activeSystemError = computed(() =>
        systemMode.value === "tasks" ? taskSystemError.value : error.value
      );
      const shiftOptions = computed(() => taskSystem.value.shifts || []);
      const taskUsers = computed(() => taskSystem.value.users || []);
      const shiftSelectOptions = computed(() =>
        shiftOptions.value.map((item) => ({ value: String(item.id), label: item.name }))
      );
      const userSelectOptions = computed(() =>
        taskUsers.value.map((item) => ({ value: item.displayLabel, label: item.displayLabel }))
      );
      const statusSelectOptions = computed(() =>
        (taskSystem.value.statusOptions || []).map((item) => ({ value: item, label: item }))
      );
      const prioritySelectOptions = computed(() =>
        (taskSystem.value.priorityOptions || []).map((item) => ({ value: item, label: item }))
      );
      const handoverRecordSelectOptions = computed(() =>
        (taskSystem.value.handovers || []).map((item) => ({
          value: String(item.id),
          label: `${item.title} / ${item.recordTime}`,
        }))
      );
      const roleSelectOptions = [
        { value: "user", label: "普通用户" },
        { value: "admin", label: "超级管理员" },
      ];
      const compareModeSelectOptions = [
        { value: "absolute", label: "按绝对值" },
        { value: "direct", label: "按原值" },
      ];
      const chartDateModeSelectOptions = [
        { value: "range", label: "时间段" },
        { value: "single", label: "某一天" },
      ];
      const filteredTaskHandovers = computed(() =>
        (taskSystem.value.handovers || []).filter((item) => {
          if (handoverFilters.dateFrom && item.recordTime.slice(0, 10) < handoverFilters.dateFrom) return false;
          if (handoverFilters.dateTo && item.recordTime.slice(0, 10) > handoverFilters.dateTo) return false;
          if (
            handoverFilters.shiftGroupId &&
            String(item.shiftGroupId || "") !== String(handoverFilters.shiftGroupId)
          ) {
            return false;
          }
          if (handoverFilters.handoverUser && item.handoverUser !== handoverFilters.handoverUser) return false;
          if (handoverFilters.receiverUser && item.receiverUser !== handoverFilters.receiverUser) return false;
          if (handoverFilters.keyword) {
            const haystack = [
              item.title,
              item.shiftName,
              item.handoverUser,
              item.receiverUser,
              item.workSummary,
              item.precautions,
              item.pendingItems,
              item.keywords,
            ]
              .join(" ")
              .toLowerCase();
            if (!haystack.includes(handoverFilters.keyword.toLowerCase())) return false;
          }
          return true;
        })
      );
      const filteredTaskItems = computed(() =>
        (taskSystem.value.tasks || []).filter((item) => {
          if (taskFilters.status && item.status !== taskFilters.status) return false;
          if (taskFilters.assigneeUser && item.assigneeUser !== taskFilters.assigneeUser) return false;
          if (taskFilters.keyword) {
            const haystack = [
              item.title,
              item.description,
              item.status,
              item.priority,
              item.assigneeUser,
              item.creatorUser,
            ]
              .join(" ")
              .toLowerCase();
            if (!haystack.includes(taskFilters.keyword.toLowerCase())) return false;
          }
          return true;
        })
      );
      const dashboardPreviewRows = computed(() => {
        const keyword = dashboardPreviewSearch.value.trim().toLowerCase();
        if (!keyword) return detailRows.value.slice(0, 8);
        return detailRows.value
          .filter((row) =>
            detailColumns.value.some((column) =>
              String(row[column.key] ?? "")
                .toLowerCase()
                .includes(keyword)
            )
          )
          .slice(0, 8);
      });
      const dashboardRankingRows = computed(() => {
        const dateLabels = dashboard.value.dimensions?.dateLabels || [];
        const recentDates = new Set(dateLabels.slice(-7));
        const rows = filteredRecords.value
          .map((record) => {
            const points = (record.values || []).filter((point) => recentDates.has(point.date));
            if (!points.length) return null;
            const numerator = points.reduce(
              (sum, point) => sum + (point.severityValue || 0) * (point.inputCount || 0),
              0
            );
            const totalInput = points.reduce((sum, point) => sum + (point.inputCount || 0), 0);
            const score = totalInput
              ? numerator / totalInput
              : points.reduce((sum, point) => sum + (point.severityValue || 0), 0) / points.length;
            return {
              key: record.recordLabel,
              label: record.recordLabel,
              score,
              totalInput,
            };
          })
          .filter(Boolean)
          .sort((left, right) => (right.score || 0) - (left.score || 0));
        return rows.slice(0, 8);
      });
      const dashboardThumbnailCards = computed(() => {
        const keyword = dashboardPreviewSearch.value.trim().toLowerCase();
        const cards = [
          {
            key: "detail",
            label: `${pageConfig.value.navLabel} 明细`,
            metaPrimary: "Detail Page",
            latestDate: overview.value.snapshotDate || "",
            metricValue: overview.value.weightedMetric,
            severityValue: overview.value.topRiskSeverity,
            inputCount: currentRows.value.reduce((sum, row) => sum + (row.inputCount || 0), 0),
            failCount: currentRows.value.reduce((sum, row) => sum + (row.failCount || 0), 0),
            statLabel: "明细记录",
            statValue: formatInteger(detailRows.value.length),
            searchableText: [
              pageConfig.value.navLabel,
              "detail",
              "明细",
              "table",
              "记录",
            ]
              .join(" ")
              .toLowerCase(),
          },
          {
            key: "charts",
            label: `${pageConfig.value.navLabel} TOP / 柱状图`,
            metaPrimary: "Charts Page",
            latestDate: overview.value.snapshotDate || "",
            metricValue: overview.value.topRiskSeverity,
            severityValue: overview.value.topRiskSeverity,
            inputCount: topRows.value[0]?.inputCount ?? overview.value.totalInput ?? null,
            failCount: topRows.value[0]?.failCount ?? overview.value.totalFail ?? null,
            statLabel: "TOP 对象",
            statValue: topRows.value[0]?.recordLabel || "--",
            searchableText: [
              pageConfig.value.navLabel,
              "chart",
              "top",
              "bar",
              "柱状图",
              "排行",
              "趋势图",
            ]
              .join(" ")
              .toLowerCase(),
          },
        ];

        return cards.filter((card) => !keyword || card.searchableText.includes(keyword));
      });
      const dashboardThumbnailPageCount = computed(() =>
        Math.max(1, Math.ceil(dashboardThumbnailCards.value.length / DASHBOARD_THUMBNAILS_PER_PAGE))
      );
      const dashboardVisibleThumbnails = computed(() => {
        const page = Math.min(dashboardGalleryPage.value, dashboardThumbnailPageCount.value);
        const start = (page - 1) * DASHBOARD_THUMBNAILS_PER_PAGE;
        return dashboardThumbnailCards.value.slice(start, start + DASHBOARD_THUMBNAILS_PER_PAGE);
      });
      const selectedDashboardThumbnail = computed(
        () => dashboardThumbnailCards.value.find((card) => card.key === selectedDashboardThumbnailKey.value) || null
      );
      const dashboardThumbnailDetailColumns = computed(() => [
        { key: "recordLabel", label: pageConfig.value.categoryLabel || "对象" },
        { key: "metricValue", label: pageConfig.value.metricLabel || pageConfig.value.chartMetricLabel || "指标" },
        { key: "inputCount", label: "投入" },
        { key: "failCount", label: "Fail" },
      ]);
      const dashboardThumbnailDetailRows = computed(() =>
        currentRows.value.slice(0, 4).map((row) => ({
          key: row.key,
          recordLabel: row.recordLabel || row.category || "--",
          metricValue:
            pageConfig.value.metricFormat === "percent"
              ? formatPercent(row.metricValue)
              : formatDecimal(row.metricValue),
          inputCount: formatInteger(row.inputCount),
          failCount: formatInteger(row.failCount),
        }))
      );
      const dashboardThumbnailChartRows = computed(() => {
        const rows = dashboardRankingRows.value.slice(0, 5);
        const maxScore = rows.reduce((max, row) => Math.max(max, Number(row.score || 0)), 0) || 1;
        return rows.map((row) => ({
          key: row.key,
          label: row.label,
          score:
            pageConfig.value.metricFormat === "percent"
              ? formatPercent(row.score)
              : formatDecimal(row.score),
          width: `${Math.max(18, (Number(row.score || 0) / maxScore) * 100)}%`,
        }));
      });
      const normalizedThresholds = computed(() => {
        if (pageConfig.value.thresholdMode === "percent") {
          return {
            yellow: Number(thresholds.yellow || 0) / 100,
            red: Number(thresholds.red || 0) / 100,
          };
        }
        return {
          yellow: Number(thresholds.yellow || 0),
          red: Number(thresholds.red || 0),
        };
      });

      const filteredRecords = computed(() =>
        dashboard.value.records.filter((record) => {
          return pageConfig.value.filters.every((field) => {
            if (field.key === "snapshotDate") return true;
            const selected = String(filters[field.key] || "").trim();
            if (!selected) return true;
            return String(record[field.key] || "").trim() === selected;
          });
        })
      );
      const chartAvailableDates = computed(() => (dashboard.value.dimensions.dateLabels || []).slice());
      const chartAvailableDateOptions = computed(() =>
        chartAvailableDates.value.map((item) => ({ value: item, label: item }))
      );
      const normalizedChartDateFilter = computed(() => {
        const dates = chartAvailableDates.value;
        const firstDate = dates[0] || "";
        const lastDate = dates[dates.length - 1] || "";
        const mode = chartDateFilter.mode === "single" ? "single" : "range";
        const singleDate = dates.includes(chartDateFilter.singleDate) ? chartDateFilter.singleDate : lastDate;
        const startCandidate = dates.includes(chartDateFilter.startDate) ? chartDateFilter.startDate : firstDate;
        const endCandidate = dates.includes(chartDateFilter.endDate) ? chartDateFilter.endDate : lastDate;
        let startDate = startCandidate;
        let endDate = endCandidate;

        if (startDate && endDate) {
          const startIndex = dates.indexOf(startDate);
          const endIndex = dates.indexOf(endDate);
          if (startIndex > endIndex) {
            startDate = endCandidate;
            endDate = startCandidate;
          }
        }

        return {
          mode,
          singleDate,
          startDate,
          endDate,
        };
      });
      const chartSelectedDates = computed(() => {
        const dates = chartAvailableDates.value;
        if (!dates.length) return new Set();
        if (normalizedChartDateFilter.value.mode === "single") {
          return new Set(normalizedChartDateFilter.value.singleDate ? [normalizedChartDateFilter.value.singleDate] : []);
        }

        const startIndex = dates.indexOf(normalizedChartDateFilter.value.startDate);
        const endIndex = dates.indexOf(normalizedChartDateFilter.value.endDate);
        if (startIndex < 0 || endIndex < 0) {
          return new Set(dates);
        }
        return new Set(dates.slice(startIndex, endIndex + 1));
      });
      const chartDateFilterLabel = computed(() => {
        if (!chartAvailableDates.value.length) return "暂无日期";
        if (normalizedChartDateFilter.value.mode === "single") {
          return normalizedChartDateFilter.value.singleDate || "未选择日期";
        }
        return `${normalizedChartDateFilter.value.startDate || "--"} 至 ${normalizedChartDateFilter.value.endDate || "--"}`;
      });
      const chartRangeRows = computed(() =>
        filteredRecords.value
          .map((record) => {
            const matchedPoints = (record.values || []).filter((point) => chartSelectedDates.value.has(point.date));
            if (!matchedPoints.length) return null;

            const totalInput = matchedPoints.reduce((sum, point) => sum + (point.inputCount || 0), 0);
            const totalFail = matchedPoints.reduce((sum, point) => sum + (point.failCount || 0), 0);
            const numerator = matchedPoints.reduce(
              (sum, point) => sum + (point.severityValue || 0) * (point.inputCount || 0),
              0
            );
            const severityValue = totalInput
              ? numerator / totalInput
              : matchedPoints.length
                ? matchedPoints.reduce((sum, point) => sum + (point.severityValue || 0), 0) / matchedPoints.length
                : null;

            return {
              key: [
                record.source,
                record.category,
                record.project,
                record.vendor,
                record.aaMC,
                record.stn,
                record.config,
                record.aaTime,
              ].join("|"),
              source: record.source,
              category: record.category,
              project: record.project,
              vendor: record.vendor,
              aaMC: record.aaMC,
              stn: record.stn,
              config: record.config,
              aaTime: record.aaTime,
              recordLabel: record.recordLabel,
              pointCount: matchedPoints.length,
              totalInput,
              totalFail,
              severityValue,
            };
          })
          .filter(Boolean)
      );

      const usesTimelineDetail = computed(() => true);
      const detailModeOptions = computed(() =>
        usesTimelineDetail.value ? getDetailModeOptionsForPage(activePage.value) : []
      );
      const activeDetailMode = computed(() => {
        const matched = detailModeOptions.value.find((option) => option.key === detailMode.value);
        return matched || detailModeOptions.value[0] || DETAIL_TIMELINE_MODE_CATALOG.rate;
      });

      const detailBaseColumns = computed(() => {
        if (!usesTimelineDetail.value) {
          return pageConfig.value.detailColumns;
        }
        return pageConfig.value.detailColumns.filter(
          (column) =>
            !["source", "category", "aaTime", "date", "metricValue", "severityValue", "inputCount", "failCount"].includes(
              column.key
            )
        );
      });

      const detailReferenceDate = computed(() => {
        let latest = null;
        for (const record of filteredRecords.value) {
          for (const point of record.values || []) {
            const parsedDate = parseDashboardDate(point.date);
            if (!parsedDate) continue;
            if (!latest || parsedDate > latest) {
              latest = parsedDate;
            }
          }
        }

        if (latest) return latest;
        return parseDashboardDate(dashboard.value.latestAvailableDate) || null;
      });

      const detailTimeColumns = computed(() =>
        usesTimelineDetail.value ? buildTimelineColumns(detailReferenceDate.value, activeDetailMode.value) : []
      );

      const detailColumns = computed(() =>
        usesTimelineDetail.value
          ? [...detailBaseColumns.value, ...detailTimeColumns.value]
          : pageConfig.value.detailColumns
      );

      const currentRows = computed(() => {
        const rows = filteredRecords.value
          .map((record) => {
            const point = resolvePoint(record.values, filters.snapshotDate || "latest");
            if (!point) return null;

            return {
              key: [
                record.source,
                record.category,
                record.project,
                record.vendor,
                record.aaMC,
                record.stn,
                record.config,
                record.aaTime,
                point.date,
              ].join("|"),
              source: record.source,
              category: record.category,
              project: record.project,
              vendor: record.vendor,
              aaMC: record.aaMC,
              stn: record.stn,
              config: record.config,
              aaTime: record.aaTime,
              recordLabel: record.recordLabel,
              date: point.date,
              metricValue: point.metricValue,
              severityValue: point.severityValue,
              inputCount: point.inputCount,
              failCount: point.failCount,
            };
          })
          .filter(Boolean);

        return sortRows(rows, detailSort);
      });

      const detailRows = computed(() => {
        if (!usesTimelineDetail.value) {
          return currentRows.value;
        }

        const rows = filteredRecords.value.map((record) => {
          const aggregates = buildTimelineAggregates(record.values);
          const row = {
            key: [
              record.source,
              record.category,
              record.project,
              record.vendor,
              record.aaMC,
              record.stn,
              record.config,
              record.aaTime,
            ].join("|"),
            source: record.source,
            category: record.category,
            project: record.project,
            vendor: record.vendor,
            aaMC: record.aaMC,
            stn: record.stn,
            config: record.config,
            aaTime: record.aaTime,
            recordLabel: record.recordLabel,
          };

          for (const column of detailTimeColumns.value) {
            const collection =
              column.timelineType === "month"
                ? aggregates.months
                : column.timelineType === "week"
                  ? aggregates.weeks
                  : aggregates.days;
            row[column.key] = resolveTimelineMetricValue(collection.get(column.timelineId), activeDetailMode.value);
          }

          return row;
        });

        return sortRows(rows, detailSort);
      });
      const detailLightCells = computed(() =>
        detailRows.value
          .slice(0, 24)
          .map((row, index) => {
            const latestTimelineColumn = detailTimeColumns.value[detailTimeColumns.value.length - 1];
            const fallbackValue =
              latestTimelineColumn && row[latestTimelineColumn.key] !== undefined
                ? row[latestTimelineColumn.key]
                : row.severityValue ?? row.metricValue ?? null;
            return {
              key: `${row.key || index}-${index}`,
              label: row.recordLabel || row.category || row.project || `Item ${index + 1}`,
              value: fallbackValue,
              displayValue: formatMetric(
                fallbackValue,
                activeDetailMode.value?.format || pageConfig.value.metricFormat
              ),
            };
          })
      );
      const detailLightPreviewCells = computed(() => detailLightCells.value.slice(0, 12));
      const detailHighlightCompareMode = computed(
        () => thresholds.compareMode || getDefaultThresholdCompareMode(activePage.value)
      );
      const canCustomizeHighlightCompareMode = computed(() => pageConfig.value.thresholdMode === "number");
      const detailRuleLabels = computed(() => {
        const yellowText = formatThreshold(thresholds.yellow);
        const redText = formatThreshold(thresholds.red);
        const valueLabel = detailHighlightCompareMode.value === "absolute" ? "|值|" : "值";
        return {
          green: `${valueLabel} < ${yellowText}`,
          yellow: `${yellowText} <= ${valueLabel} < ${redText}`,
          red: `${valueLabel} >= ${redText}`,
        };
      });
      const detailRuleModeLabel = computed(() =>
        detailHighlightCompareMode.value === "absolute" ? "按绝对值高亮" : "按原值高亮"
      );

      const overview = computed(() => {
        const rows = currentRows.value;
        const totalInput = rows.reduce((sum, row) => sum + (row.inputCount || 0), 0);
        const totalFail = rows.reduce((sum, row) => sum + (row.failCount || 0), 0);
        const weightedNumerator = rows.reduce(
          (sum, row) => sum + (row.severityValue || 0) * (row.inputCount || 0),
          0
        );
        const weightedMetric = totalInput
          ? weightedNumerator / totalInput
          : rows.length
            ? rows.reduce((sum, row) => sum + (row.severityValue || 0), 0) / rows.length
            : null;
        const topRisk = rows
          .slice()
          .sort((left, right) => (right.severityValue || 0) - (left.severityValue || 0))[0];
        const maxSeverity = rows.reduce(
          (max, row) => Math.max(max, row.severityValue || 0),
          0
        );

        return {
          snapshotDate: rows[0]?.date || dashboard.value.latestAvailableDate || "",
          totalInput,
          totalFail,
          weightedMetric,
          maxSeverity,
          topRiskLabel: topRisk ? topRisk.recordLabel : "--",
          topRiskSeverity: topRisk?.severityValue ?? null,
        };
      });

      const trendSeries = computed(() => {
        const buckets = new Map();
        for (const date of chartAvailableDates.value) {
          if (!chartSelectedDates.value.has(date)) continue;
          buckets.set(date, { date, numerator: 0, totalInput: 0, totalFail: 0, count: 0 });
        }

        for (const record of filteredRecords.value) {
          for (const point of record.values) {
            const bucket = buckets.get(point.date);
            if (!bucket) continue;
            bucket.numerator += (point.severityValue || 0) * (point.inputCount || 0);
            bucket.totalInput += point.inputCount || 0;
            bucket.totalFail += point.failCount || 0;
            bucket.count += 1;
          }
        }

        return Array.from(buckets.values()).map((item) => ({
          date: item.date,
          totalInput: item.totalInput,
          totalFail: item.totalFail,
          weightedMetric: item.totalInput ? item.numerator / item.totalInput : null,
        }));
      });

      const categoryRows = computed(() => {
        const grouped = new Map();
        for (const row of chartRangeRows.value) {
          if (!grouped.has(row.category)) {
            grouped.set(row.category, {
              category: row.category,
              count: 0,
              totalInput: 0,
              totalFail: 0,
              numerator: 0,
            });
          }
          const bucket = grouped.get(row.category);
          bucket.count += 1;
          bucket.totalInput += row.inputCount || 0;
          bucket.totalFail += row.failCount || 0;
          bucket.numerator += (row.severityValue || 0) * (row.inputCount || 0);
        }

        return Array.from(grouped.values())
          .map((item) => ({
            category: item.category,
            count: item.count,
            totalInput: item.totalInput,
            totalFail: item.totalFail,
            weightedMetric: item.totalInput ? item.numerator / item.totalInput : null,
          }))
          .sort((left, right) => (right.weightedMetric || 0) - (left.weightedMetric || 0));
      });

      const topRows = computed(() =>
        chartRangeRows.value
          .slice()
          .sort((left, right) => (right.severityValue || 0) - (left.severityValue || 0))
          .slice(0, 10)
      );

      const exportColumns = computed(() => pageConfig.value.exportColumns);

      function getPageFromPath(pathname) {
        if (pathname === ROUTES.oc) return "oc";
        if (pathname === ROUTES.lens) return "lens";
        if (pathname === ROUTES.angle) return "angle";
        const stored = window.localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
        return PAGE_CONFIGS[stored] ? stored : "angle";
      }

      function setRoute(path, replace = false) {
        const current = window.location.pathname + window.location.search;
        if (current === path) return;
        window.history[replace ? "replaceState" : "pushState"]({}, "", path);
      }

      function syncRouteWithState(replace = false) {
        if (!isAuthenticated.value) {
          setRoute(ROUTES.login, replace);
          return;
        }
        if (systemMode.value === "dashboard") {
          setRoute(pageConfig.value.route, replace);
          return;
        }
        setRoute(ROUTES.home, replace);
      }

      async function requestJson(url, options) {
        const response = await fetch(url, {
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            ...(options?.headers || {}),
          },
          ...options,
        });

        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          isAuthenticated.value = false;
          authUser.value = {
            username: "",
            displayName: "",
            displayLabel: "",
            department: "",
            email: "",
            phone: "",
            updatedAt: "",
          };
          syncRouteWithState(true);
          throw new Error(AUTH_REQUIRED_ERROR);
        }

        if (!response.ok) {
          throw new Error(payload.message || "Request failed.");
        }

        return payload;
      }

      async function requestFormData(url, payload, files = [], options = {}) {
        const formData = new FormData();
        formData.append("payload", JSON.stringify(payload));
        files.forEach((file) => formData.append("attachments", file));

        const response = await fetch(url, {
          method: options.method || "POST",
          credentials: "same-origin",
          body: formData,
        });

        const responsePayload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          isAuthenticated.value = false;
          syncRouteWithState(true);
          throw new Error(AUTH_REQUIRED_ERROR);
        }
        if (!response.ok) {
          throw new Error(responsePayload.message || "Request failed.");
        }
        return responsePayload;
      }

      function resetProfileForm() {
        profileForm.username = authUser.value.username || "";
        profileForm.displayName = authUser.value.displayName || "";
        profileForm.department = authUser.value.department || "";
        profileForm.email = authUser.value.email || "";
        profileForm.phone = authUser.value.phone || "";
        profileForm.newPassword = "";
        profileForm.confirmPassword = "";
        profileMessage.value = "";
      }

      function resetHandoverForm() {
        handoverForm.id = "";
        handoverForm.title = "";
        handoverForm.shiftGroupId = String(taskSystem.value.currentUser?.shiftGroupId || "");
        handoverForm.recordTime = new Date().toISOString().slice(0, 16);
        handoverForm.handoverUser = authUser.value.displayLabel || authUser.value.username || "";
        handoverForm.receiverUser = "";
        handoverForm.workSummary = "";
        handoverForm.precautions = "";
        handoverForm.pendingItems = "";
        handoverForm.keywords = "";
        handoverFiles.value = [];
      }

      function resetTaskForm() {
        taskForm.id = "";
        taskForm.title = "";
        taskForm.description = "";
        taskForm.status = "未开始";
        taskForm.priority = "中";
        taskForm.dueAt = "";
        taskForm.assigneeUser = "";
        taskForm.handoverRecordId = "";
        taskForm.reminderAt = "";
        taskFiles.value = [];
      }

      function resetUserForm() {
        userForm.username = "";
        userForm.displayName = "";
        userForm.department = "";
        userForm.email = "";
        userForm.phone = "";
        userForm.role = "user";
        userForm.isActive = true;
        userForm.shiftGroupId = "";
        userForm.password = "";
      }

      function getRoleLabel(role) {
        return role === "admin" ? "超级管理员" : "普通用户";
      }

      function resetShiftForm() {
        shiftForm.id = "";
        shiftForm.name = "";
        shiftForm.startTime = "08:00";
        shiftForm.endTime = "16:00";
        shiftForm.sortOrder = 0;
        shiftForm.isActive = true;
      }

      function syncSettingsForm() {
        settingsForm["notifications.handover_minutes"] =
          taskSystem.value.settings["notifications.handover_minutes"] ?? 30;
        settingsForm["notifications.task_due_hours"] =
          taskSystem.value.settings["notifications.task_due_hours"] ?? 24;
        settingsForm["permissions.assign_admin"] =
          taskSystem.value.settings["permissions.assign_admin"] ?? true;
      }

      function resetFilters() {
        for (const field of pageConfig.value.filters) {
          filters[field.key] = field.key === "snapshotDate" ? "latest" : "";
        }
      }

      function loadThresholdsForPage(page, defaults) {
        const defaultCompareMode = getDefaultThresholdCompareMode(page);
        const stored = window.localStorage.getItem(`${THRESHOLD_STORAGE_PREFIX}${page}`);
        if (!stored) {
          thresholds.yellow = defaults.yellow;
          thresholds.red = defaults.red;
          thresholds.compareMode = defaultCompareMode;
          return;
        }

        try {
          const parsed = JSON.parse(stored);
          thresholds.yellow = Number(parsed.yellow ?? defaults.yellow);
          thresholds.red = Number(parsed.red ?? defaults.red);
          thresholds.compareMode = parsed.compareMode || defaultCompareMode;
        } catch (errorInstance) {
          thresholds.yellow = defaults.yellow;
          thresholds.red = defaults.red;
          thresholds.compareMode = defaultCompareMode;
        }
      }

      function persistThresholds() {
        window.localStorage.setItem(
          `${THRESHOLD_STORAGE_PREFIX}${activePage.value}`,
          JSON.stringify({
            yellow: Number(thresholds.yellow || 0),
            red: Number(thresholds.red || 0),
            compareMode: thresholds.compareMode || getDefaultThresholdCompareMode(activePage.value),
          })
        );
      }

      function resetThresholds() {
        thresholds.yellow = dashboard.value.thresholds.yellow;
        thresholds.red = dashboard.value.thresholds.red;
        thresholds.compareMode = getDefaultThresholdCompareMode(activePage.value);
        persistThresholds();
      }

      function resetChartDateFilter() {
        const dates = chartAvailableDates.value;
        chartDateFilter.mode = "range";
        chartDateFilter.singleDate = dates[dates.length - 1] || "";
        chartDateFilter.startDate = dates[0] || "";
        chartDateFilter.endDate = dates[dates.length - 1] || "";
      }

      function updateThreshold(key, value) {
        thresholds[key] = Number(value || 0);
      }

      function resetChartSettings() {
        chartSettings.trend.xAxisLabel = "日期";
        chartSettings.trend.yAxisLabel = pageConfig.value.chartMetricLabel || "指标";
        chartSettings.trend.secondaryYAxisLabel = "投入数";
        chartSettings.trend.xAxisRotate = 0;

        chartSettings.category.xAxisLabel = pageConfig.value.chartMetricLabel || "指标";
        chartSettings.category.yAxisLabel = pageConfig.value.categoryLabel || "分类";
        chartSettings.category.xAxisRotate = 0;

        chartSettings.top.xAxisLabel = pageConfig.value.chartMetricLabel || "指标";
        chartSettings.top.yAxisLabel = "对象";
        chartSettings.top.xAxisRotate = 0;

      }

      function initializePageState() {
        for (const field of pageConfig.value.filters) {
          if (!(field.key in filters)) {
            filters[field.key] = field.key === "snapshotDate" ? "latest" : "";
          }
        }
        resetFilters();
        resetChartDateFilter();
        detailMode.value = getDefaultDetailMode(activePage.value);
        loadThresholdsForPage(activePage.value, dashboard.value.thresholds);
        resetChartSettings();
        resetDetailSort();
        exportForm.filters = {};
        exportForm.columns = pageConfig.value.exportColumns.map((item) => item.key);
        resetDashboardGalleryState();
      }

      async function loadSession() {
        authChecking.value = true;
        try {
          const payload = await requestJson("/api/session");
          isAuthenticated.value = Boolean(payload.authenticated);
          authUser.value = payload.user || authUser.value;
          if (isAuthenticated.value) {
            resetProfileForm();
          }
        } catch (errorInstance) {
          authMessage.value = errorInstance instanceof Error ? errorInstance.message : String(errorInstance);
        } finally {
          authChecking.value = false;
        }
      }

      async function login() {
        loginSubmitting.value = true;
        authMessage.value = "";
        try {
          const payload = await requestJson("/api/login", {
            method: "POST",
            body: JSON.stringify(loginForm),
          });
          isAuthenticated.value = true;
          authUser.value = payload.user;
          resetProfileForm();
          applyCurrentPageToState(true);
          systemMode.value = "tasks";
          window.localStorage.setItem(ACTIVE_SYSTEM_STORAGE_KEY, "tasks");
          syncRouteWithState(true);
          await fetchTaskSystem();
        } catch (errorInstance) {
          authMessage.value = errorInstance instanceof Error ? errorInstance.message : String(errorInstance);
        } finally {
          loginSubmitting.value = false;
        }
      }

      async function logout() {
        try {
          await requestJson("/api/logout", { method: "POST" });
        } catch (errorInstance) {
          // Ignore logout transport issues and clear local state anyway.
        }
        isAuthenticated.value = false;
        authUser.value = {
          username: "",
          displayName: "",
          displayLabel: "",
          department: "",
          email: "",
          phone: "",
          updatedAt: "",
        };
        taskSystem.value = createEmptyTaskSystem();
        syncRouteWithState(true);
      }

      function openProfileDialog() {
        resetProfileForm();
        profileDialogOpen.value = true;
      }

      function closeProfileDialog() {
        profileDialogOpen.value = false;
      }

      async function saveProfile() {
        profileSaving.value = true;
        profileMessage.value = "";
        profileMessageTone.value = "error";

        try {
          const payload = await requestJson("/api/profile", {
            method: "POST",
            body: JSON.stringify(profileForm),
          });
          authUser.value = payload.user;
          resetProfileForm();
          profileMessage.value = payload.message || "个人信息已保存。";
          profileMessageTone.value = "success";
        } catch (errorInstance) {
          profileMessage.value = errorInstance instanceof Error ? errorInstance.message : String(errorInstance);
          profileMessageTone.value = "error";
        } finally {
          profileSaving.value = false;
        }
      }

      function setTaskActionMessage(message, tone = "success") {
        taskActionMessage.value = message;
        taskActionTone.value = tone;
      }

      function handleFileSelection(targetName, event) {
        const files = Array.from(event.target.files || []);
        if (targetName === "handover") {
          handoverFiles.value = files;
          return;
        }
        if (targetName === "task") {
          taskFiles.value = files;
        }
      }

      function editHandover(record) {
        handoverForm.id = String(record.id);
        handoverForm.title = record.title;
        handoverForm.shiftGroupId = String(record.shiftGroupId || "");
        handoverForm.recordTime = (record.recordTime || "").replace(" ", "T").slice(0, 16);
        handoverForm.handoverUser = record.handoverUser;
        handoverForm.receiverUser = record.receiverUser;
        handoverForm.workSummary = record.workSummary;
        handoverForm.precautions = record.precautions;
        handoverForm.pendingItems = record.pendingItems;
        handoverForm.keywords = record.keywords;
        handoverFiles.value = [];
        taskSection.value = "handover";
      }

      function editTask(item) {
        taskForm.id = String(item.id);
        taskForm.title = item.title;
        taskForm.description = item.description;
        taskForm.status = item.status || "未开始";
        taskForm.priority = item.priority || "中";
        taskForm.dueAt = (item.dueAt || "").replace(" ", "T").slice(0, 16);
        taskForm.assigneeUser = item.assigneeUser;
        taskForm.handoverRecordId = String(item.handoverRecordId || "");
        taskForm.reminderAt = (item.reminderAt || "").replace(" ", "T").slice(0, 16);
        taskFiles.value = [];
        taskSection.value = "tasks";
      }

      function editUser(item) {
        userForm.username = item.username;
        userForm.displayName = item.displayName;
        userForm.department = item.department;
        userForm.email = item.email;
        userForm.phone = item.phone;
        userForm.role = item.role;
        userForm.isActive = item.isActive;
        userForm.shiftGroupId = String(item.shiftGroupId || "");
        userForm.password = "";
        taskSection.value = "users";
      }

      function editShift(item) {
        shiftForm.id = String(item.id);
        shiftForm.name = item.name;
        shiftForm.startTime = item.startTime;
        shiftForm.endTime = item.endTime;
        shiftForm.sortOrder = item.sortOrder;
        shiftForm.isActive = item.isActive;
        taskSection.value = "settings";
      }

      async function submitHandover() {
        taskActionSubmitting.value = true;
        setTaskActionMessage("", "error");
        try {
          await requestFormData(
            "/api/task-system/handover-records",
            {
              ...handoverForm,
              shiftGroupId: handoverForm.shiftGroupId || null,
            },
            handoverFiles.value
          );
          await fetchTaskSystem();
          resetHandoverForm();
          setTaskActionMessage("交接班记录已保存。");
        } catch (errorInstance) {
          setTaskActionMessage(
            errorInstance instanceof Error ? errorInstance.message : String(errorInstance),
            "error"
          );
        } finally {
          taskActionSubmitting.value = false;
        }
      }

      async function submitTask() {
        taskActionSubmitting.value = true;
        setTaskActionMessage("", "error");
        try {
          await requestFormData(
            "/api/task-system/tasks",
            {
              ...taskForm,
              handoverRecordId: taskForm.handoverRecordId || null,
            },
            taskFiles.value
          );
          await fetchTaskSystem();
          resetTaskForm();
          setTaskActionMessage("任务已保存。");
        } catch (errorInstance) {
          setTaskActionMessage(
            errorInstance instanceof Error ? errorInstance.message : String(errorInstance),
            "error"
          );
        } finally {
          taskActionSubmitting.value = false;
        }
      }

      async function submitUser() {
        taskActionSubmitting.value = true;
        setTaskActionMessage("", "error");
        try {
          await requestJson("/api/task-system/users", {
            method: "POST",
            body: JSON.stringify({
              ...userForm,
              shiftGroupId: userForm.shiftGroupId || null,
            }),
          });
          await fetchTaskSystem();
          resetUserForm();
          setTaskActionMessage("用户信息已保存。");
        } catch (errorInstance) {
          setTaskActionMessage(
            errorInstance instanceof Error ? errorInstance.message : String(errorInstance),
            "error"
          );
        } finally {
          taskActionSubmitting.value = false;
        }
      }

      async function submitShift() {
        taskActionSubmitting.value = true;
        setTaskActionMessage("", "error");
        try {
          await requestJson("/api/task-system/shifts", {
            method: "POST",
            body: JSON.stringify({
              ...shiftForm,
              id: shiftForm.id || null,
            }),
          });
          await fetchTaskSystem();
          resetShiftForm();
          setTaskActionMessage("班次设置已保存。");
        } catch (errorInstance) {
          setTaskActionMessage(
            errorInstance instanceof Error ? errorInstance.message : String(errorInstance),
            "error"
          );
        } finally {
          taskActionSubmitting.value = false;
        }
      }

      async function submitSettings() {
        taskActionSubmitting.value = true;
        setTaskActionMessage("", "error");
        try {
          await requestJson("/api/task-system/settings", {
            method: "POST",
            body: JSON.stringify({ ...settingsForm }),
          });
          await fetchTaskSystem();
          setTaskActionMessage("系统设置已保存。");
        } catch (errorInstance) {
          setTaskActionMessage(
            errorInstance instanceof Error ? errorInstance.message : String(errorInstance),
            "error"
          );
        } finally {
          taskActionSubmitting.value = false;
        }
      }

      async function downloadTaskExport(type, format) {
        taskActionSubmitting.value = true;
        setTaskActionMessage("", "error");
        try {
          const response = await fetch("/api/task-system/export", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              format,
              filters: type === "handover" ? handoverFilters : taskFilters,
            }),
          });
          if (response.status === 401) {
            throw new Error(AUTH_REQUIRED_ERROR);
          }
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.message || "导出失败。");
          }
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          const disposition = response.headers.get("Content-Disposition") || "";
          const matchedName = disposition.match(/filename=\"?([^\";]+)\"?/i);
          link.href = objectUrl;
          link.download = matchedName ? matchedName[1] : `${type}.xlsx`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(objectUrl);
          setTaskActionMessage("导出成功。");
        } catch (errorInstance) {
          if (errorInstance instanceof Error && errorInstance.message === AUTH_REQUIRED_ERROR) {
            await logout();
            return;
          }
          setTaskActionMessage(
            errorInstance instanceof Error ? errorInstance.message : String(errorInstance),
            "error"
          );
        } finally {
          taskActionSubmitting.value = false;
        }
      }

      function openExportDialog() {
        exportForm.filters = {};
        for (const field of pageConfig.value.filters) {
          exportForm.filters[field.key] = filters[field.key] || (field.key === "snapshotDate" ? "latest" : "");
        }
        exportForm.columns = pageConfig.value.exportColumns.map((item) => item.key);
        exportMessage.value = "";
        exportDialogOpen.value = true;
      }

      function closeExportDialog() {
        exportDialogOpen.value = false;
      }

      function resetExportForm() {
        openExportDialog();
      }

      function isExportColumnSelected(key) {
        return exportForm.columns.includes(key);
      }

      function toggleExportColumn(key) {
        if (isExportColumnSelected(key)) {
          if (exportForm.columns.length === 1) return;
          exportForm.columns = exportForm.columns.filter((item) => item !== key);
          return;
        }
        exportForm.columns = [...exportForm.columns, key];
      }

      async function downloadExport() {
        exportSubmitting.value = true;
        exportMessageTone.value = "error";
        exportMessage.value = "";

        try {
          if (!exportForm.columns.length) {
            throw new Error("请至少选择一个导出字段。");
          }

          const response = await fetch("/api/export-excel", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              page: activePage.value,
              filters: exportForm.filters,
              columns: exportForm.columns,
            }),
          });

          if (response.status === 401) {
            throw new Error(AUTH_REQUIRED_ERROR);
          }

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.message || "导出失败。");
          }

          const blob = await response.blob();
          const link = document.createElement("a");
          const objectUrl = URL.createObjectURL(blob);
          const disposition = response.headers.get("Content-Disposition") || "";
          const matchedName = disposition.match(/filename=\"?([^\";]+)\"?/i);
          link.href = objectUrl;
          link.download = matchedName ? matchedName[1] : `${activePage.value}_export.xlsx`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(objectUrl);
          exportMessageTone.value = "success";
          exportMessage.value = "Excel 导出成功。";
        } catch (errorInstance) {
          exportMessageTone.value = "error";
          if (errorInstance instanceof Error && errorInstance.message === AUTH_REQUIRED_ERROR) {
            exportMessage.value = "登录状态已失效，请重新登录。";
            await logout();
          } else {
            exportMessage.value = errorInstance instanceof Error ? errorInstance.message : String(errorInstance);
          }
        } finally {
          exportSubmitting.value = false;
        }
      }

      async function fetchDashboard(refresh = false) {
        loading.value = true;
        error.value = "";
        try {
          dashboard.value = await requestJson(
            `/api/dashboard?page=${encodeURIComponent(activePage.value)}${refresh ? "&refresh=1" : ""}`
          );
          initializePageState();
        } catch (errorInstance) {
          if (errorInstance instanceof Error && errorInstance.message === AUTH_REQUIRED_ERROR) return;
          error.value = errorInstance instanceof Error ? errorInstance.message : String(errorInstance);
        } finally {
          loading.value = false;
        }
      }

      async function fetchTaskSystem() {
        taskSystemLoading.value = true;
        taskSystemError.value = "";
        try {
          taskSystem.value = await requestJson("/api/task-system/bootstrap");
          syncSettingsForm();
          resetHandoverForm();
          resetTaskForm();
          resetUserForm();
          resetShiftForm();
        } catch (errorInstance) {
          if (errorInstance instanceof Error && errorInstance.message === AUTH_REQUIRED_ERROR) return;
          taskSystemError.value =
            errorInstance instanceof Error ? errorInstance.message : String(errorInstance);
        } finally {
          taskSystemLoading.value = false;
        }
      }

      async function switchPage(page, options = {}) {
        if (!PAGE_CONFIGS[page]) return;
        activePage.value = page;
        window.localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, page);
        navDrawerOpen.value = false;
        if (!options.skipRoute && systemMode.value === "dashboard") {
          setRoute(PAGE_CONFIGS[page].route, Boolean(options.replaceRoute));
        }
        if (isAuthenticated.value && systemMode.value === "dashboard") {
          await fetchDashboard(false);
        }
      }

      async function switchSystem(mode) {
        if (!["tasks", "dashboard"].includes(mode)) return;
        systemMode.value = mode;
        window.localStorage.setItem(ACTIVE_SYSTEM_STORAGE_KEY, mode);
        navDrawerOpen.value = false;
        syncRouteWithState(true);
        if (!isAuthenticated.value) return;
        if (mode === "tasks") {
          await fetchTaskSystem();
        } else if (!dashboard.value.records.length) {
          await fetchDashboard(false);
        } else {
          resetDashboardGalleryState();
        }
      }

      async function refreshActivePage() {
        if (systemMode.value === "tasks") {
          await fetchTaskSystem();
          return;
        }
        await fetchDashboard(true);
      }

      function applyCurrentPageToState(replaceRoute = false) {
        const routePage = getPageFromPath(window.location.pathname);
        activePage.value = PAGE_CONFIGS[routePage] ? routePage : "angle";
        const storedSystem = window.localStorage.getItem(ACTIVE_SYSTEM_STORAGE_KEY);
        systemMode.value = storedSystem === "dashboard" ? "dashboard" : "tasks";
        syncRouteWithState(replaceRoute);
      }

      function handlePopState() {
        if (!isAuthenticated.value) {
          syncRouteWithState(true);
          return;
        }
        applyCurrentPageToState(true);
      }

      function resolvePoint(values, snapshotDate) {
        if (!values || !values.length) return null;
        if (snapshotDate === "latest") return values[values.length - 1];
        return values.find((item) => item.date === snapshotDate) || null;
      }

      function getFilterOptions(field) {
        return dashboard.value.dimensions[field.optionsKey] || [];
      }

      function getDashboardSnapshotDateOptions() {
        const field = pageConfig.value.filters.find((item) => item.key === "snapshotDate") || {
          optionsKey: "dateLabels",
          latestLabel: "最新数据",
        };
        return [
          { value: "latest", label: field.latestLabel || "最新数据" },
          ...getFilterOptions(field).map((item) => ({ value: item, label: item })),
        ];
      }

      function getExportFilterSelectOptions(field) {
        const defaultOption =
          field.key === "snapshotDate"
            ? { value: "latest", label: field.latestLabel || "最新数据" }
            : { value: "", label: "全部" };
        return [
          defaultOption,
          ...getFilterOptions(field).map((item) => ({ value: item, label: item })),
        ];
      }

      function getRiskLevel(value) {
        const numericValue = toFiniteNumber(value);
        if (numericValue === null) return "unknown";
        if (numericValue >= normalizedThresholds.value.red) return "red";
        if (numericValue >= normalizedThresholds.value.yellow) return "yellow";
        return "green";
      }

      function getRiskClass(value) {
        return `risk-${getRiskLevel(value)}`;
      }

      function getRiskLabel(value) {
        const level = getRiskLevel(value);
        if (level === "red") return "高风险";
        if (level === "yellow") return "关注";
        if (level === "green") return "正常";
        return "无等级";
      }

      function getRiskColor(value) {
        return RISK_COLORS[getRiskLevel(value)] || RISK_COLORS.neutral;
      }

      function toFiniteNumber(value) {
        if (value === null || value === undefined || value === "") return null;
        const number = typeof value === "number" ? value : Number(value);
        return Number.isFinite(number) ? number : null;
      }

      function formatInteger(value) {
        const number = toFiniteNumber(value);
        if (number === null) return "--";
        return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 }).format(number);
      }

      function formatDecimal(value, digits = 3) {
        const number = toFiniteNumber(value);
        if (number === null) return "--";
        return number.toFixed(digits);
      }

      function formatPercent(value) {
        const number = toFiniteNumber(value);
        if (number === null) return "--";
        return `${(number * 100).toFixed(2)}%`;
      }

      function formatDateTime(value) {
        if (!value) return "--";
        return String(value).replace("T", " ");
      }

      function formatThreshold(value) {
        const number = toFiniteNumber(value) ?? 0;
        if (pageConfig.value.thresholdMode === "percent") {
          return `${number.toFixed(2)}%`;
        }
        return number.toFixed(2);
      }

      function formatMetric(value, format = pageConfig.value.metricFormat) {
        if (format === "text") {
          return value === null || value === undefined || value === "" ? "--" : String(value);
        }
        if (format === "percent") return formatPercent(value);
        if (format === "integer") return formatInteger(value);
        if (format === "signedDecimal") {
          const number = toFiniteNumber(value);
          if (number === null) return "--";
          return number > 0 ? `+${number.toFixed(3)}` : number.toFixed(3);
        }
        return formatDecimal(value);
      }

      function formatColumnValue(row, column) {
        const value = row[column.key];
        return formatMetric(value, column.format);
      }

      function resetDashboardGalleryState() {
        dashboardGalleryView.value = "grid";
        dashboardGalleryPage.value = 1;
        selectedDashboardThumbnailKey.value = "";
        dashboardPreviewSearch.value = "";
      }

      function openDashboardThumbnail(card) {
        if (!card?.key) return;
        selectedDashboardThumbnailKey.value = card.key;
        dashboardGalleryView.value = "detail";
        if (card.key === "charts") {
          nextTick(() => {
            renderCharts();
          });
        }
      }

      function backToThumbnailGrid() {
        dashboardGalleryView.value = "grid";
      }

      function changeDashboardThumbnailPage(direction) {
        const nextPage = dashboardGalleryPage.value + direction;
        dashboardGalleryPage.value = Math.min(
          dashboardThumbnailPageCount.value,
          Math.max(1, nextPage)
        );
      }

      function getDetailColumnClass(column) {
        if (column.columnClass) return column.columnClass;
        if (column.key === "project") return "detail-col-fixed detail-col-project";
        if (column.key === "vendor" || column.key === "config") return "detail-col-fixed detail-col-medium";
        if (column.key === "aaMC" || column.key === "stn") return "detail-col-fixed detail-col-small";
        return "detail-col-fixed";
      }

      function getDetailCellClass(row, column) {
        const classes = [getDetailColumnClass(column)];
        if (column.risk) {
          classes.push("rate-cell", getDetailRiskClass(row[column.key], column));
        }
        return classes;
      }

      function isDetailHighlightCell(column) {
        return Boolean(column?.risk);
      }

      function shouldRenderDetailValueBox(row, column) {
        return isDetailHighlightCell(column) && toFiniteNumber(row?.[column.key]) !== null;
      }

      function getDetailRiskValue(value, column) {
        const numericValue = toFiniteNumber(value);
        if (numericValue === null) return null;
        if (column?.risk && detailHighlightCompareMode.value === "absolute") {
          return Math.abs(numericValue);
        }
        return numericValue;
      }

      function getDetailRiskLevel(value, column) {
        const numericValue = getDetailRiskValue(value, column);
        if (numericValue === null) return "unknown";
        if (numericValue >= normalizedThresholds.value.red) return "red";
        if (numericValue >= normalizedThresholds.value.yellow) return "yellow";
        return "green";
      }

      function getDetailRiskClass(value, column) {
        return `risk-${getDetailRiskLevel(value, column)}`;
      }

      function getDetailValueBoxClass(row, column) {
        const classes = ["detail-value-box"];
        if (column?.risk) {
          classes.push(getDetailRiskClass(row[column.key], column));
        }
        if (column?.timelineType) {
          classes.push("detail-value-box-compact");
        }
        return classes;
      }

      function compareValues(left, right) {
        const leftEmpty = left === null || left === undefined || Number.isNaN(left);
        const rightEmpty = right === null || right === undefined || Number.isNaN(right);
        if (leftEmpty && rightEmpty) return 0;
        if (leftEmpty) return 1;
        if (rightEmpty) return -1;
        if (typeof left === "number" && typeof right === "number") return left - right;
        return String(left).localeCompare(String(right), "zh-CN", { numeric: true, sensitivity: "base" });
      }

      function sortRows(rows, sortState) {
        return rows.slice().sort((left, right) => {
          for (const criterion of sortState) {
            const direction = criterion.direction === "asc" ? 1 : -1;
            const result = compareValues(left[criterion.field], right[criterion.field]);
            if (result !== 0) return result * direction;
          }
          return 0;
        });
      }

      function getDefaultDetailSortField() {
        if (usesTimelineDetail.value && detailTimeColumns.value.length) {
          return detailTimeColumns.value[detailTimeColumns.value.length - 1].key;
        }
        return "severityValue";
      }

      function resetDetailSort() {
        detailSort.splice(0, detailSort.length, {
          field: getDefaultDetailSortField(),
          direction: "desc",
        });
      }

      function getDefaultSortDirection(field) {
        return ["metricValue", "severityValue", "inputCount", "failCount"].includes(field) ||
          String(field || "").startsWith("timeline:")
          ? "desc"
          : "asc";
      }

      function setDetailMode(mode) {
        if (!detailModeOptions.value.some((option) => option.key === mode) || detailMode.value === mode) return;
        detailMode.value = mode;
      }

      function toggleDetailSort(field, event) {
        const existingIndex = detailSort.findIndex((item) => item.field === field);

        if (existingIndex >= 0) {
          detailSort[existingIndex].direction =
            detailSort[existingIndex].direction === "asc" ? "desc" : "asc";
          return;
        }

        detailSort.push({
          field,
          direction: getDefaultSortDirection(field),
        });
      }

      function getSortIndicator(field) {
        const index = detailSort.findIndex((item) => item.field === field);
        if (index < 0) return "↕";
        const arrow = detailSort[index].direction === "asc" ? "↑" : "↓";
        return detailSort.length > 1 ? `${arrow}${index + 1}` : arrow;
      }

      function getDetailSortIndicator(field) {
        const index = detailSort.findIndex((item) => item.field === field);
        if (index < 0) return "--";
        const arrow = detailSort[index].direction === "asc" ? "^" : "v";
        return detailSort.length > 1 ? `${arrow}${index + 1}` : arrow;
      }

      function ensureCharts() {
        if (!window.echarts) return;
        const targets = {
          trend: "trend-chart",
          category: "category-chart",
          top: "top-chart",
        };

        Object.entries(targets).forEach(([key, elementId]) => {
          const element = document.getElementById(elementId);
          if (!element) {
            if (chartRefs[key]) {
              chartRefs[key].dispose();
              chartRefs[key] = null;
            }
            return;
          }

          if (chartRefs[key] && chartRefs[key].getDom() !== element) {
            chartRefs[key].dispose();
            chartRefs[key] = null;
          }

          if (!chartRefs[key]) {
            chartRefs[key] = window.echarts.init(element);
          }
        });
      }

      function disposeCharts() {
        Object.keys(chartRefs).forEach((key) => {
          if (chartRefs[key]) {
            chartRefs[key].dispose();
            chartRefs[key] = null;
          }
        });
      }

      async function renderCharts() {
        await nextTick();
        if (!isAuthenticated.value || loading.value || error.value) return;
        ensureCharts();
        if (!chartRefs.trend || !chartRefs.category || !chartRefs.top) return;

        const metricFormatter =
          pageConfig.value.metricFormat === "percent"
            ? (value) => `${(Number(value) * 100).toFixed(2)}%`
            : (value) => Number(value).toFixed(3);

        chartRefs.trend.setOption({
          textStyle: { color: CHART_TEXT },
          color: ["#38bdf8", "#22d3ee"],
          animationDuration: 500,
          tooltip: {
            trigger: "axis",
            backgroundColor: CHART_TOOLTIP_BG,
            borderColor: CHART_AXIS,
            textStyle: { color: CHART_TEXT },
          },
          legend: { top: 0, textStyle: { color: CHART_TEXT } },
          grid: { left: 56, right: 24, top: 52, bottom: 28 },
          xAxis: {
            type: "category",
            name: chartSettings.trend.xAxisLabel,
            nameTextStyle: { color: CHART_TEXT, padding: [12, 0, 0, 0] },
            data: trendSeries.value.map((item) => item.date),
            axisLabel: { color: CHART_MUTED, rotate: Number(chartSettings.trend.xAxisRotate || 0) },
            axisLine: { lineStyle: { color: CHART_AXIS } },
          },
          yAxis: [
            {
              type: "value",
              name: chartSettings.trend.yAxisLabel || pageConfig.value.chartMetricLabel,
              nameTextStyle: { color: CHART_TEXT, padding: [0, 0, 8, 0] },
              axisLabel: {
                color: CHART_MUTED,
                formatter: metricFormatter,
              },
              axisLine: { lineStyle: { color: CHART_AXIS } },
              splitLine: { lineStyle: { color: CHART_SPLIT } },
            },
            {
              type: "value",
              name: "投入数",
              nameTextStyle: { color: CHART_TEXT, padding: [0, 0, 8, 0] },
              axisLabel: { color: CHART_MUTED },
              axisLine: { lineStyle: { color: CHART_AXIS } },
              splitLine: { show: false },
            },
          ],
          series: [
            {
              name: pageConfig.value.chartMetricLabel,
              type: "line",
              smooth: true,
              symbolSize: 10,
              data: trendSeries.value.map((item) => item.weightedMetric),
              areaStyle: { color: "rgba(56, 189, 248, 0.14)" },
              markLine: {
                symbol: "none",
                label: {
                  color: CHART_TEXT,
                  backgroundColor: "rgba(5, 16, 30, 0.88)",
                  padding: [4, 8],
                  borderRadius: 6,
                  formatter: ({ name, value }) => `${name} ${formatMetric(value)}`,
                },
                data: [
                  {
                    name: "黄色阈值",
                    yAxis: normalizedThresholds.value.yellow,
                    lineStyle: { color: RISK_COLORS.yellow, type: "dashed", width: 2 },
                    label: { position: "end", distance: [10, -12] },
                  },
                  {
                    name: "红色阈值",
                    yAxis: normalizedThresholds.value.red,
                    lineStyle: { color: RISK_COLORS.red, type: "dashed", width: 2 },
                    label: { position: "end", distance: [10, 10] },
                  },
                ],
              },
            },
            {
              name: "投入数",
              type: "bar",
              yAxisIndex: 1,
              barMaxWidth: 28,
              data: trendSeries.value.map((item) => item.totalInput),
            },
          ],
        });

        chartRefs.category.setOption({
          textStyle: { color: CHART_TEXT },
          tooltip: {
            trigger: "axis",
            backgroundColor: CHART_TOOLTIP_BG,
            borderColor: CHART_AXIS,
            textStyle: { color: CHART_TEXT },
          },
          grid: { left: 56, right: 20, top: 24, bottom: 28 },
          xAxis: {
            type: "value",
            name: chartSettings.category.xAxisLabel || pageConfig.value.chartMetricLabel,
            nameTextStyle: { color: CHART_TEXT, padding: [12, 0, 0, 0] },
            axisLabel: {
              color: CHART_MUTED,
              formatter: metricFormatter,
            },
            axisLine: { lineStyle: { color: CHART_AXIS } },
            splitLine: { lineStyle: { color: CHART_SPLIT } },
          },
          yAxis: {
            type: "category",
            name: chartSettings.category.yAxisLabel || pageConfig.value.categoryLabel,
            nameTextStyle: { color: CHART_TEXT, padding: [0, 0, 8, 0] },
            data: categoryRows.value.map((item) => item.category),
            axisLabel: { color: CHART_MUTED, rotate: Number(chartSettings.category.xAxisRotate || 0) },
            axisLine: { lineStyle: { color: CHART_AXIS } },
            axisTick: { lineStyle: { color: CHART_AXIS } },
          },
          series: [
            {
              type: "bar",
              barWidth: 24,
              data: categoryRows.value.map((item) => ({
                value: item.weightedMetric,
                itemStyle: { color: getRiskColor(item.weightedMetric) },
              })),
              label: {
                show: true,
                position: "right",
                color: CHART_TEXT,
                formatter: ({ value }) => formatMetric(value),
              },
            },
          ],
        });

        chartRefs.top.setOption({
          textStyle: { color: CHART_TEXT },
          tooltip: {
            trigger: "axis",
            backgroundColor: CHART_TOOLTIP_BG,
            borderColor: CHART_AXIS,
            textStyle: { color: CHART_TEXT },
          },
          grid: { left: 120, right: 18, top: 24, bottom: 28 },
          xAxis: {
            type: "value",
            name: chartSettings.top.xAxisLabel || pageConfig.value.chartMetricLabel,
            nameTextStyle: { color: CHART_TEXT, padding: [12, 0, 0, 0] },
            axisLabel: {
              color: CHART_MUTED,
              formatter: metricFormatter,
            },
            axisLine: { lineStyle: { color: CHART_AXIS } },
            splitLine: { lineStyle: { color: CHART_SPLIT } },
          },
          yAxis: {
            type: "category",
            name: chartSettings.top.yAxisLabel || "对象",
            nameTextStyle: { color: CHART_TEXT, padding: [0, 0, 8, 0] },
            data: topRows.value.map((item) => item.recordLabel),
            axisLabel: { color: CHART_MUTED, rotate: Number(chartSettings.top.xAxisRotate || 0) },
            axisLine: { lineStyle: { color: CHART_AXIS } },
            axisTick: { lineStyle: { color: CHART_AXIS } },
          },
          series: [
            {
              type: "bar",
              barWidth: 18,
              data: topRows.value.map((item) => ({
                value: item.severityValue,
                itemStyle: { color: getRiskColor(item.severityValue) },
              })),
              label: {
                show: true,
                position: "right",
                color: CHART_TEXT,
                formatter: ({ value }) => formatMetric(value),
              },
            },
          ],
        });

        Object.values(chartRefs).forEach((chart) => chart && chart.resize());
      }

      function handleResize() {
        Object.values(chartRefs).forEach((chart) => chart && chart.resize());
      }

      watch([() => thresholds.yellow, () => thresholds.red, () => thresholds.compareMode], persistThresholds);
      watch(
        [dashboardGalleryView, selectedDashboardThumbnail],
        () => {
          if (dashboardGalleryView.value === "detail" && selectedDashboardThumbnail.value?.key === "charts") {
            renderCharts();
            return;
          }
          disposeCharts();
        },
        { deep: true }
      );
      watch(
        dashboardThumbnailCards,
        () => {
          if (dashboardGalleryPage.value > dashboardThumbnailPageCount.value) {
            dashboardGalleryPage.value = dashboardThumbnailPageCount.value;
          }
          if (dashboardGalleryView.value === "detail" && !selectedDashboardThumbnail.value) {
            dashboardGalleryView.value = "grid";
            selectedDashboardThumbnailKey.value = "";
          }
        },
        { deep: true }
      );
      watch(
        detailColumns,
        () => {
          const validFields = new Set(detailColumns.value.map((column) => column.key));
          if (!detailSort.length || detailSort.some((item) => !validFields.has(item.field))) {
            resetDetailSort();
          }
        },
        { deep: true }
      );
      watch(
        chartAvailableDates,
        () => {
          const dates = chartAvailableDates.value;
          if (!dates.length) {
            chartDateFilter.singleDate = "";
            chartDateFilter.startDate = "";
            chartDateFilter.endDate = "";
            return;
          }

          if (!dates.includes(chartDateFilter.singleDate)) {
            chartDateFilter.singleDate = dates[dates.length - 1];
          }
          if (!dates.includes(chartDateFilter.startDate)) {
            chartDateFilter.startDate = dates[0];
          }
          if (!dates.includes(chartDateFilter.endDate)) {
            chartDateFilter.endDate = dates[dates.length - 1];
          }
        },
        { deep: true, immediate: true }
      );
      watch(
        [currentRows, trendSeries, categoryRows, topRows, normalizedThresholds, activePage],
        () => {
          renderCharts();
        },
        { deep: true }
      );
      watch(
        chartSettings,
        () => {
          if (dashboardGalleryView.value === "detail" && selectedDashboardThumbnail.value?.key === "charts") {
            renderCharts();
          }
        },
        { deep: true }
      );

      onMounted(async () => {
        await loadSession();
        if (isAuthenticated.value) {
          applyCurrentPageToState(true);
          if (systemMode.value === "dashboard") {
            await fetchDashboard(false);
          } else {
            await fetchTaskSystem();
          }
        } else {
          syncRouteWithState(true);
        }
        window.addEventListener("resize", handleResize);
        window.addEventListener("popstate", handlePopState);
      });

      onBeforeUnmount(() => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("popstate", handlePopState);
        disposeCharts();
      });

      return {
        authChecking,
        isAuthenticated,
        authMessage,
        authUser,
        loginSubmitting,
        loading,
        error,
        navDrawerOpen,
        profileDialogOpen,
        profileSaving,
        profileMessage,
        profileMessageTone,
        exportDialogOpen,
        exportSubmitting,
        exportMessage,
        exportMessageTone,
        loginForm,
        profileForm,
        systemMode,
        taskSection,
        activePage,
        dashboard,
        taskSystem,
        activeSystemLoading,
        activeSystemError,
        filters,
        thresholds,
        chartDateFilter,
        exportForm,
        dashboardPreviewSearch,
        dashboardGalleryView,
        dashboardGalleryPage,
        chartSettings,
        handoverFilters,
        taskFilters,
        handoverForm,
        taskForm,
        userForm,
        shiftForm,
        settingsForm,
        handoverFiles,
        taskFiles,
        taskActionSubmitting,
        taskActionMessage,
        taskActionTone,
        pageConfig,
        currentRows,
        detailRows,
        detailColumns,
        detailMode,
        detailModeOptions,
        usesTimelineDetail,
        isAdmin,
        shiftOptions,
        taskUsers,
        shiftSelectOptions,
        userSelectOptions,
        statusSelectOptions,
        prioritySelectOptions,
        handoverRecordSelectOptions,
        roleSelectOptions,
        compareModeSelectOptions,
        chartDateModeSelectOptions,
        filteredTaskHandovers,
        filteredTaskItems,
        dashboardPreviewRows,
        dashboardRankingRows,
        dashboardThumbnailCards,
        dashboardThumbnailPageCount,
        dashboardVisibleThumbnails,
        dashboardThumbnailDetailColumns,
        dashboardThumbnailDetailRows,
        dashboardThumbnailChartRows,
        detailLightCells,
        detailLightPreviewCells,
        chartAvailableDates,
        chartAvailableDateOptions,
        chartDateFilterLabel,
        detailHighlightCompareMode,
        canCustomizeHighlightCompareMode,
        detailRuleLabels,
        detailRuleModeLabel,
        selectedDashboardThumbnail,
        overview,
        trendSeries,
        categoryRows,
        topRows,
        exportColumns,
        pageList: Object.values(PAGE_CONFIGS),
        login,
        logout,
        switchSystem,
        switchPage,
        refreshActivePage,
        resetFilters,
        updateThreshold,
        resetThresholds,
        resetChartDateFilter,
        getFilterOptions,
        getDashboardSnapshotDateOptions,
        getExportFilterSelectOptions,
        getRiskClass,
        getRiskLabel,
        getRoleLabel,
        formatInteger,
        formatDecimal,
        formatPercent,
        formatDateTime,
        formatThreshold,
        formatColumnValue,
        isDetailHighlightCell,
        shouldRenderDetailValueBox,
        getDetailValueBoxClass,
        openDashboardThumbnail,
        backToThumbnailGrid,
        changeDashboardThumbnailPage,
        getDetailColumnClass,
        getDetailCellClass,
        resetDetailSort,
        setDetailMode,
        toggleDetailSort,
        getSortIndicator,
        getDetailSortIndicator,
        handleFileSelection,
        editHandover,
        editTask,
        editUser,
        editShift,
        submitHandover,
        submitTask,
        submitUser,
        submitShift,
        submitSettings,
        downloadTaskExport,
        resetHandoverForm,
        resetTaskForm,
        resetUserForm,
        resetShiftForm,
        openProfileDialog,
        closeProfileDialog,
        resetProfileForm,
        saveProfile,
        openExportDialog,
        closeExportDialog,
        resetExportForm,
        isExportColumnSelected,
        toggleExportColumn,
        downloadExport,
      };
    },
  }).mount("#app");
})();
