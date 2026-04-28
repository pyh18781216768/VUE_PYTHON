# 项目维护地图

这份文档用于后续快速定位需求，目标是“改哪个模块，尽量只碰哪个模块”。

## 总体结构

- 入口：`app.py`
- Flask 初始化：`fab_app/__init__.py`
- 后端路由：`fab_app/controllers/`
- 后端业务：`fab_app/services/`
- 数据库访问：`fab_app/repositories/`
- 新 Vue 工程：`frontend/`
- 新 Vue 打包产物：`static/frontend/`
- 新 Vue 入口模板：`templates/frontend_index.html`
- 旧 Vue 模板：`templates/index.html`
- 旧 Vue 逻辑：`static/app.js`
- 旧样式：`static/styles.css`

## 新 Vue 工程

- 入口：`frontend/src/main.js`
- 根组件：`frontend/src/App.vue`
- 路由：`frontend/src/router/index.js`
- API：`frontend/src/api/`
- 状态管理：`frontend/src/stores/`
- 通用组件：`frontend/src/components/`
- 组合式逻辑：`frontend/src/composables/`
- 页面：`frontend/src/views/`
- 工程化样式：`frontend/src/styles/frontend.css`
- 旧页面托管：`frontend/src/views/LegacyAppHost.vue`

当前已新增页面：

- `frontend/src/views/Dashboard.vue`
- `frontend/src/views/Handover.vue`
- `frontend/src/views/Tasks.vue`
- `frontend/src/views/Upload.vue`
- `frontend/src/views/Users.vue`
- `frontend/src/views/Operations.vue`
- `frontend/src/views/Settings.vue`

当前已新增通用组件：

- `frontend/src/components/Navbar.vue`
- `frontend/src/components/notifications/NotificationBell.vue`
- `frontend/src/components/ChartCard.vue`
- `frontend/src/components/DataTable.vue`
- `frontend/src/components/ModalDialog.vue`
- `frontend/src/components/base/SearchableSelect.vue`
- `frontend/src/components/base/MultiSearchableSelect.vue`
- `frontend/src/components/handover/AttachmentList.vue`
- `frontend/src/components/handover/AttachmentPreviewDialog.vue`
- `frontend/src/components/handover/HandoverFormDialog.vue`
- `frontend/src/components/handover/HandoverDetailDialog.vue`
- `frontend/src/components/tasks/TaskFormDialog.vue`
- `frontend/src/components/tasks/TaskRejectDialog.vue`
- `frontend/src/components/tasks/TaskSubmitDialog.vue`
- `frontend/src/components/tasks/TaskReviewDialog.vue`
- `frontend/src/components/tasks/TaskDetailDialog.vue`
- `frontend/src/components/users/UserFormDialog.vue`
- `frontend/src/components/users/UserPermissionDialog.vue`
- `frontend/src/components/users/UserDetailDialog.vue`

当前已新增组合式逻辑：

- `frontend/src/composables/useTaskSettings.js`
- `frontend/src/composables/useOperationLogs.js`
- `frontend/src/composables/useUsers.js`
- `frontend/src/composables/useHandovers.js`
- `frontend/src/composables/useTasks.js`
- `frontend/src/composables/useNotifications.js`

## 业务模块定位

### 登录、退出、个人信息

- 路由：`fab_app/controllers/auth_controller.py`
- 业务：`fab_app/services/user_service.py`
- 数据：`fab_app/repositories/user_repository.py`
- 旧前端：`templates/index.html`、`static/app.js`

### 用户管理

- 路由：`fab_app/controllers/task_controller.py` 中 `/api/task-system/users`
- 业务：`fab_app/services/task_system_service.py` 中 `list_users`、`save_user`
- 数据：`fab_app/repositories/user_repository.py`
- 新页面：`frontend/src/views/Users.vue`
- 当前状态：`/task-system/users` 已切到新 Vue 页面，支持查询、排序、新增、编辑、删除、双击详情和超级管理员赋权。

### 交接班记录

- 路由：`fab_app/controllers/task_controller.py` 中 `/api/task-system/handover-records`
- 业务：`fab_app/services/task_system_service.py` 中 `list_handover_records`、`save_handover_record`
- 数据：`fab_app/repositories/task_repository.py` 中交接班表
- 导出：`fab_app/services/task_export_service.py`
- 新页面：`frontend/src/views/Handover.vue`
- 当前状态：`/task-system/handover` 已切到新 Vue 页面，支持查询、排序、Excel 导出、新增、编辑、删除、附件下载、图片预览和双击详情。

### 任务清单

- 路由：`fab_app/controllers/task_controller.py` 中 `/api/task-system/tasks`
- 业务：`fab_app/services/task_system_service.py` 中 `list_tasks`、`save_task`
- 数据：`fab_app/repositories/task_repository.py` 中任务表
- 导出：`fab_app/services/task_export_service.py`
- 新页面：`frontend/src/views/Tasks.vue`
- 当前状态：`/task-system/tasks` 已切到新 Vue 页面，支持查询、排序、Excel 导出、新增、编辑、删除、领取、驳回、提交审核、评分、附件下载、图片预览和双击详情。

### 通知中心、铃铛提醒

- 路由：复用 `fab_app/controllers/task_controller.py` 中 `/api/task-system/bootstrap` 和 `/api/task-system/reminders`
- 业务：`fab_app/services/task_system_service.py` 中 `get_reminders`
- 新组件：`frontend/src/components/notifications/NotificationBell.vue`
- 新逻辑：`frontend/src/composables/useNotifications.js`
- 当前状态：新 Vue 页面右上角固定显示铃铛，支持红点计数、提醒弹窗、清除已读、点击消息查看交接班或任务详情。

### 操作记录

- 路由：`fab_app/controllers/task_controller.py` 中 `/api/task-system/operation-logs`
- 业务：`fab_app/services/task_system_service.py` 中 `list_operation_logs`、`record_operation`
- 导出：`fab_app/services/task_export_service.py`
- 新页面：`frontend/src/views/Operations.vue`
- 当前状态：`/task-system/operations` 已切到新 Vue 页面，支持查询、排序、Excel 导出。

### 系统设置、班次、楼层、部门

- 路由：`fab_app/controllers/task_controller.py` 中 `/api/task-system/shifts`、`/api/task-system/floors`、`/api/task-system/departments`
- 业务：`fab_app/services/task_system_service.py` 中 `list_shift_groups`、`save_shift_group`、`list_floors`、`save_floor`、`list_departments`、`save_department`
- 数据：`fab_app/repositories/task_repository.py` 中设置类表
- 新页面：`frontend/src/views/Settings.vue`
- 当前状态：`/task-system/settings` 已切到新 Vue 页面，支持新增、搜索、删除。

### 看板系统

- 路由：`fab_app/controllers/dashboard_controller.py`
- 业务：`fab_app/services/dashboard_service.py`
- 数据：`fab_app/repositories/dashboard_repository.py`
- 导出：`fab_app/services/export_service.py`
- 新页面：`frontend/src/views/Dashboard.vue`

## 新需求修改流程

1. 先定位后端接口、业务服务、数据库访问文件。
2. 如果是新页面或新组件，优先写到 `frontend/src/views/` 或 `frontend/src/components/`。
3. 如果旧页面还没迁移，先保证 `LegacyAppHost.vue` 下的旧功能不受影响。
4. 每次修改后执行 `powershell -ExecutionPolicy Bypass -File scripts\check_project.ps1`。
5. 需要上线到 Flask 静态目录时执行 `npm --prefix frontend run build`。
