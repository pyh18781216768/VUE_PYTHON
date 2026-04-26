# 项目维护地图

这份文档用于以后快速定位需求和问题，尽量做到“改哪个模块，只碰哪个模块”。

## 总体结构

- 入口：`app.py`
- Flask 应用初始化：`fab_app/__init__.py`
- 后端路由层：`fab_app/controllers/`
- 后端业务层：`fab_app/services/`
- 后端数据库层：`fab_app/repositories/`
- 前端页面模板：`templates/index.html`
- 前端交互逻辑：`static/app.js`
- 前端样式：`static/styles.css`
- 本地 Vue/ECharts：`static/vendor/`

## 模块定位

### 登录、退出、个人信息

- 路由：`fab_app/controllers/auth_controller.py`
- 业务：`fab_app/services/user_service.py`
- 数据：`fab_app/repositories/user_repository.py`
- 前端弹窗：`templates/index.html` 中 `profileDialogOpen`
- 前端状态/保存：`static/app.js` 中 `profileForm`、`resetProfileForm`、`saveProfile`
- 常见需求：工号、密码、个人信息字段、主管、登录报错、会话失效

### 用户管理

- 路由：`fab_app/controllers/task_controller.py` 中 `/api/task-system/users`
- 业务：`fab_app/services/task_system_service.py` 中 `list_users`、`save_user`
- 数据：`fab_app/repositories/user_repository.py`
- 前端区域：`templates/index.html` 中 `taskSection === 'users'`
- 前端状态：`static/app.js` 中 `userFilters`、`userForm`、`filteredTaskUsers`
- 常见需求：工号、姓名、职位、权限等级、账号列表排序、新增/编辑用户

### 交接班记录

- 路由：`fab_app/controllers/task_controller.py` 中 `/api/task-system/handover-records`
- 业务：`fab_app/services/task_system_service.py` 中 `list_handover_records`、`save_handover_record`
- 数据：`fab_app/repositories/task_repository.py` 中 `HANDOVER_RECORD`
- 导出：`fab_app/services/task_export_service.py`
- 前端区域：`templates/index.html` 中 `taskSection === 'handover'`
- 前端状态：`static/app.js` 中 `handoverFilters`、`handoverForm`、`filteredTaskHandovers`
- 常见需求：交班班次、接班班次、楼层、接班人、主管、关键词、附件、历史列表字段、排序

### 任务清单

- 路由：`fab_app/controllers/task_controller.py` 中 `/api/task-system/tasks`
- 业务：`fab_app/services/task_system_service.py` 中 `list_tasks`、`save_task`
- 数据：`fab_app/repositories/task_repository.py` 中 `TASK_ITEM`
- 导出：`fab_app/services/task_export_service.py`
- 前端区域：`templates/index.html` 中 `taskSection === 'tasks'`
- 前端状态：`static/app.js` 中 `taskFilters`、`taskForm`、`filteredTaskItems`
- 常见需求：开始时间、到期时间、负责人、关联交接班、主管、附件、任务列表字段、排序

### 系统设置、班次、楼层、部门

- 路由：`fab_app/controllers/task_controller.py` 中 `/api/task-system/shifts`、`/api/task-system/floors`、`/api/task-system/departments`
- 业务：`fab_app/services/task_system_service.py` 中 `list_shift_groups`、`save_shift_group`、`list_floors`、`save_floor`、`list_departments`、`save_department`
- 数据：`fab_app/repositories/task_repository.py` 中 `SHIFT_GROUP`、`FLOOR_SETTING`、`DEPARTMENT_SETTING`
- 前端区域：`templates/index.html` 中 `taskSection === 'settings'`
- 前端状态：`static/app.js` 中 `shiftForm`、`floorForm`、`departmentForm`、`filteredShiftOptions`、`filteredFloorOptions`、`filteredDepartmentOptions`
- 常见需求：新增班次、新增楼层、新增部门、删除、排序、下拉框选项来源

### 看板系统

- 路由：`fab_app/controllers/dashboard_controller.py`
- 业务：`fab_app/services/dashboard_service.py`
- 导出：`fab_app/services/export_service.py`
- 数据：`fab_app/repositories/dashboard_repository.py`
- 页面配置：`static/app.js` 中 `PAGE_CONFIGS`
- 前端区域：`templates/index.html` 中 `systemMode === 'dashboard'`
- 常见需求：Angle/OC/Lens 页面、缩略图、图表、看板 Excel 导出、筛选下拉框

### 下拉框、弹窗、样式

- 搜索下拉组件：`static/app.js` 中 `SearchableSelect`
- 弹窗层级：`static/styles.css` 中 `modal-layer`、`modal-backdrop`、`searchable-select`
- 页面缓存版本：`templates/index.html` 中 `styles.css?v=...` 和 `app.js?v=...`
- 常见需求：下拉框被遮挡、点击后卡住、弹窗模糊、可输入搜索类下拉框、清空后重新选择

## 新增字段的安全流程

1. 数据库层：在 repository 的建表语句和 `ensure_column`/字段列表里加字段。
2. 业务层：在 service 的保存 payload、列表 summary、筛选搜索里加字段。
3. 路由层：通常不用动，除非新增接口。
4. 前端状态：在 `static/app.js` 对应 form/filter/computed 里加字段。
5. 前端页面：在 `templates/index.html` 对应表单或列表里加字段。
6. 导出：如果列表字段需要导出，更新对应 export service。
7. 缓存版本：修改 `templates/index.html` 的 CSS/JS 版本号。
8. 验证：运行 `scripts/check_project.ps1`。

## 修改时的隔离原则

- 改交接班，不顺手改任务，除非需求明确说“关联任务也要显示”。
- 改任务，不改看板导出，除非是任务导出。
- 改看板，不动任务系统接口。
- 改样式下拉框时优先限定在弹窗或组件范围，避免影响所有页面。
- 改用户字段时同时检查个人信息、用户管理、权限判断三处。
