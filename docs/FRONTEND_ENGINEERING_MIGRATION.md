# Vue 工程化迁移说明

项目正在从“Vue 全部写在 `static/app.js`”迁移到“独立 Vue 工程 + Flask API 后端”。

## 当前运行方式

- Flask 继续提供 `/api/...` 后端接口。
- `frontend/` 是新的 Vue 工程，使用 Vite、Vue Router、Pinia。
- `npm --prefix frontend run build` 会把新前端打包到 `static/frontend/`。
- Flask 检测到 `static/frontend/assets/index.js` 后，会优先渲染 `templates/frontend_index.html`。
- 旧页面暂时由 `frontend/src/views/LegacyAppHost.vue` 托管，避免迁移中影响现有业务。

## 当前新页面

- `frontend/src/views/Dashboard.vue`：看板总览入口。
- `frontend/src/views/Handover.vue`：交接班记录查询、新增、编辑、删除、附件和详情。
- `frontend/src/views/Tasks.vue`：任务清单查询、新增、编辑、领取、驳回、提交审核、评分、附件和详情。
- `frontend/src/views/Upload.vue`：交接班和任务新增入口。
- `frontend/src/views/Users.vue`：使用者管理查询、排序、新增、编辑、删除、详情和权限赋予。
- `frontend/src/views/Operations.vue`：操作记录查询、排序、导出。
- `frontend/src/views/Settings.vue`：班次、楼层、部门设置。

## 已开始迁移的旧模块

- `/task-system/settings` 已切到 `frontend/src/views/Settings.vue`。
- 系统设置中的班次、楼层、部门已经使用新 Vue 页面完成新增、搜索、删除。
- `/task-system/operations` 已切到 `frontend/src/views/Operations.vue`。
- 操作记录已经使用新 Vue 页面完成查询、排序、Excel 导出。
- `/task-system/users` 已切到 `frontend/src/views/Users.vue`。
- 使用者管理已经拆成页面、表单弹窗、权限弹窗、详情弹窗和 `useUsers` 组合式逻辑。
- `/task-system/handover` 已切到 `frontend/src/views/Handover.vue`。
- 交接班记录已经拆成页面、表单弹窗、详情弹窗、附件列表、图片预览和 `useHandovers` 组合式逻辑。
- `/task-system/tasks` 已切到 `frontend/src/views/Tasks.vue`。
- 任务清单已经拆成页面、任务表单、驳回弹窗、提交审核弹窗、评分弹窗、详情弹窗和 `useTasks` 组合式逻辑。
- 新 Vue 页面已经接入右上角通知中心 `NotificationBell.vue`。
- 通知中心已经拆出 `useNotifications.js`，支持红点计数、清除已读、点击消息查看交接班或任务详情。
- 报表模块已移除，前端 `Report.vue` 和后端 `/api/task-system/reports` 都不再保留。
- 旧系统其余模块仍由 `LegacyAppHost.vue` 托管。

## 当前通用组件

- `frontend/src/components/Navbar.vue`：新工程导航栏。
- `frontend/src/components/ChartCard.vue`：指标卡片。
- `frontend/src/components/DataTable.vue`：通用数据表格，支持插槽和表头排序。
- `frontend/src/components/ModalDialog.vue`：通用弹窗容器。
- `frontend/src/components/notifications/NotificationBell.vue`：右上角通知铃铛和提醒弹窗。
- `frontend/src/components/base/SearchableSelect.vue`：可输入搜索下拉框基础组件。
- `frontend/src/components/base/MultiSearchableSelect.vue`：可输入搜索多选下拉框。
- `frontend/src/components/handover/`：交接班记录相关弹窗和附件组件。
- `frontend/src/components/tasks/`：任务清单相关弹窗和详情组件。
- `frontend/src/components/users/`：使用者管理相关弹窗组件。

## 当前组合式逻辑

- `frontend/src/composables/useTaskSettings.js`：系统设置的班次、楼层、部门加载、新增、删除逻辑。
- `frontend/src/composables/useOperationLogs.js`：操作记录查询、排序和导出逻辑。
- `frontend/src/composables/useUsers.js`：使用者管理查询、排序、保存、删除和赋权逻辑。
- `frontend/src/composables/useHandovers.js`：交接班记录查询、排序、导出、保存、删除和附件提交逻辑。
- `frontend/src/composables/useTasks.js`：任务清单查询、排序、导出、保存、删除、领取、驳回、提交审核和评分逻辑。
- `frontend/src/composables/useNotifications.js`：通知提醒加载、已读、清除已读和提醒详情定位逻辑。

## 迁移路线

1. 保留 `LegacyAppHost.vue`，确保旧系统继续可用。
2. 新需求优先在 `frontend/src/views/` 和 `frontend/src/components/` 中实现。
3. 每迁移完一个旧模块，就把对应路由从 `LegacyAppHost` 切到新的 `.vue` 页面。
4. 所有页面迁移完成后，再删除旧的 `templates/index.html` 中 Vue 模板和 `static/app.js`。

## 常用命令

```powershell
npm --prefix frontend run dev
npm --prefix frontend run build
powershell -ExecutionPolicy Bypass -File scripts\check_project.ps1
```
