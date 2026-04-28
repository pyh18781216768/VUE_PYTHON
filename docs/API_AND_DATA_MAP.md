# API and Data Map

This file is a quick locator for backend changes. Use it before adding fields, changing validation, or adjusting export behavior.

## Auth APIs

- `GET /api/session`
  - Controller: `fab_app/controllers/auth_controller.py`
  - Service: `fab_app/services/user_service.py`
  - Purpose: read current login session and return the current profile.

- `POST /api/login`
  - Controller: `fab_app/controllers/auth_controller.py`
  - Service: `fab_app/services/user_service.py`
  - Repository: `fab_app/repositories/user_repository.py`
  - Purpose: authenticate by employee number and password.

- `POST /api/logout`
  - Controller: `fab_app/controllers/auth_controller.py`
  - Purpose: clear the Flask session.

- `GET /api/profile` and `POST /api/profile`
  - Controller: `fab_app/controllers/auth_controller.py`
  - Service: `fab_app/services/user_service.py`
  - Repository: `fab_app/repositories/user_repository.py`
  - Purpose: read and save personal information, including supervisor.

## Task System APIs

- `GET /api/task-system/bootstrap`
  - Controller: `fab_app/controllers/task_controller.py`
  - Service: `get_task_system_payload`
  - Purpose: initial payload for users, shifts, floors, handovers, tasks, and reminders.

- `GET /api/task-system/users` and `POST /api/task-system/users`
  - Service: `list_users`, `save_user`
  - Repository: `fab_app/repositories/user_repository.py`
  - Frontend: user management page and user modal.

- `GET /api/task-system/shifts`, `POST /api/task-system/shifts`, `DELETE /api/task-system/shifts/<id>`
  - Service: `list_shift_groups`, `save_shift_group`, `delete_shift_group`
  - Repository table: `SHIFT_GROUP`
  - Frontend: system settings shift list and shift modal.

- `GET /api/task-system/floors`, `POST /api/task-system/floors`, `DELETE /api/task-system/floors/<id>`
  - Service: `list_floors`, `save_floor`, `delete_floor`
  - Repository table: `FLOOR_SETTING`
  - Frontend: system settings floor list and floor modal.

- `GET /api/task-system/departments`, `POST /api/task-system/departments`, `DELETE /api/task-system/departments/<id>`
  - Service: `list_departments`, `save_department`, `delete_department`
  - Repository table: `DEPARTMENT_SETTING`
  - Frontend: system settings department list/modal and user department dropdown.

- `GET /api/task-system/handover-records` and `POST /api/task-system/handover-records`
  - Service: `list_handover_records`, `save_handover_record`
  - Repository table: `HANDOVER_RECORD`
  - Export: `fab_app/services/task_export_service.py`
  - Frontend: handover filters, handover modal, and history list.

- `GET /api/task-system/tasks` and `POST /api/task-system/tasks`
  - Service: `list_tasks`, `save_task`
  - Repository table: `TASK_ITEM`
  - Export: `fab_app/services/task_export_service.py`
  - Frontend: task filters, task modal, and task list.

- `GET /api/task-system/reminders`
  - Service: `get_reminders`
  - Purpose: user-scoped notification-bell payload.
  - Notes: handover reminders use the receiver shift arrival time; task reminders use task start time; assignee/receiver and `@工号` or `@姓名` mentions can receive reminders.

- `POST /api/task-system/export`
  - Service: `fab_app/services/task_export_service.py`
  - Purpose: handover/task Excel export.

- `GET /api/task-system/attachments/<id>`
  - Service: `get_attachment_file`
  - Repository table: `ATTACHMENT`
  - Purpose: download uploaded files.

## Dashboard APIs

- `GET /api/dashboard?page=angle|oc|lens`
  - Controller: `fab_app/controllers/dashboard_controller.py`
  - Service: `fab_app/services/dashboard_service.py`
  - Repository: `fab_app/repositories/dashboard_repository.py`
  - Frontend: dashboard thumbnail/detail pages.

- `POST /api/export-excel`
  - Controller: `fab_app/controllers/dashboard_controller.py`
  - Service: `fab_app/services/export_service.py`
  - Frontend: dashboard Excel export dialog.

- `GET /api/health`
  - Controller: `fab_app/controllers/dashboard_controller.py`
  - Purpose: simple health/database count check.

## Main Tables

- `USER`
  - Key fields: `user`, `password`, `display_name`, `department`, `supervisor_user`, `role`, `created_at`, `updated_at`
  - Important note: UI calls `user` the employee number.

- `SHIFT_GROUP`
  - Key fields: `id`, `name`, `start_time`, `end_time`, `sort_order`, `created_at`, `updated_at`
  - Used by handover records when choosing a shift.

- `FLOOR_SETTING`
  - Key fields: `id`, `name`, `sort_order`, `created_at`, `updated_at`
  - Used by handover records when choosing a floor.

- `DEPARTMENT_SETTING`
  - Key fields: `id`, `name`, `sort_order`, `created_at`, `updated_at`
  - Used by user management when choosing a department.

- `HANDOVER_RECORD`
  - Key fields: `id`, `shift_group_id`, `floor_id`, `record_time`, `handover_user`, `receiver_user`, `work_summary`, `precautions`, `pending_items`, `keywords`, `created_by`, `created_at`, `updated_at`
  - Important note: frontend shows `created_at` as created time.
  - Important note: `shift_group_id` is the handover user's shift; the receiver shift is derived as the next shift by shift sort order.

- `TASK_ITEM`
  - Key fields: `id`, `title`, `description`, `status`, `priority`, `start_at`, `due_at`, `assignee_user`, `creator_user`, `handover_record_id`, `created_at`, `updated_at`, `completed_at`
  - Important note: linked handover labels should include enough context to identify the record.

- `ATTACHMENT`
  - Key fields: `owner_type`, `owner_id`, `original_name`, `stored_name`, `stored_path`, `content_type`, `uploaded_by`, `uploaded_at`
  - Used by handover records and tasks.

- `SYSTEM_SETTING`
  - Key fields: `key`, `value`, `updated_at`, `updated_by`
  - Reserved for system-level configuration.

## Safe Field-Change Checklist

1. Add or verify the database column in the repository create-table and migration helpers.
2. Add save/list mapping in the service layer.
3. Add validation in the service layer if the field is required or has date/order rules.
4. Add frontend form state in `static/app.js`.
5. Add the form/list column in `templates/index.html`.
6. Add export mapping if users need it in Excel.
7. Bump static asset version in `templates/index.html` when JS or CSS changes.
8. Run `scripts/check_project.ps1`.
