# Frontend Section Map

This file is a locator for frontend requests. It keeps future changes narrow and reduces accidental impact across modules.

## Core Files

- `templates/index.html`: page layout, forms, modals, lists, buttons, and bindings.
- `static/app.js`: Vue state, computed lists, validation, submit handlers, sorting, exports, and charts.
- `static/styles.css`: layout, modal layers, dropdown menus, table styles, and responsive behavior.

## Template Areas

- Login page
  - Look for: `!isAuthenticated`
  - Common requests: login error text, employee number label, password field.

- Task-system header and drawer
  - Look for: `systemMode === 'tasks'`, `taskSection`
  - Common requests: sidebar/menu behavior, top notification bell, switching handover/task/user/settings pages.

- Handover page
  - Look for: `taskSection === 'handover'`
  - Includes: handover filters, new/edit modal, history handover list. Reminder display now lives in the top notification bell.
  - Common requests: shift, floor, receiver, supervisor display, keywords, attachments, sort columns.

- Task page
  - Look for: `taskSection === 'tasks'`
  - Includes: task filters, new/edit modal, task list, linked handover dropdown.
  - Common requests: start/due time validation, status, priority, assignee, linked handover label.

- User page
  - Look for: `taskSection === 'users'`
  - Includes: user filters, new/edit modal, account list.
  - Common requests: employee number, position/role, department dropdown, supervisor, sorting.

- System settings page
  - Look for: `taskSection === 'settings'`
  - Includes: shift list/modal, floor list/modal, and department list/modal.
  - Common requests: add/delete shifts, add/delete floors, add/delete departments, dropdown option sources.

- Dashboard pages
  - Look for: `systemMode === 'dashboard'`
  - Includes: Angle/OC/Lens cards, charts, detail table, dashboard export dialog.
  - Common requests: chart text, dashboard filters, Excel export field selection.

- Personal profile modal
  - Look for: `profileDialogOpen`
  - Common requests: phone/email/department/supervisor/password.

- Dashboard export modal
  - Look for: `exportDialogOpen`
  - Common requests: filter dropdowns, export columns, blur/z-index issues.

## JavaScript Areas

- Page configs
  - Anchor comment: `// === Dashboard page configs ===`
  - Purpose: Angle/OC/Lens labels, filters, detail columns, export columns.

- Shared searchable select
  - Anchor comment: `// === Shared searchable select component ===`
  - Purpose: all searchable dropdown behavior, clear-on-focus behavior, menu open/close behavior.

- App setup and state
  - Anchor comment: `// === App setup and state ===`
  - Purpose: login state, modal state, task-system state, filters, forms, sorting state.

- Request helpers and form resets
  - Anchor comment: `// === Request helpers and form reset helpers ===`
  - Purpose: `requestJson`, `requestFormData`, reset/open/close functions for modals.

- Submit and delete handlers
  - Anchor comment: `// === Task-system submit and delete handlers ===`
  - Purpose: saving handovers, tasks, users, shifts, floors, and deleting shifts/floors.

- Export and data loading
  - Anchor comment: `// === Export and data loading helpers ===`
  - Purpose: task export, dashboard export, fetching dashboard/task-system data.

- Sorting helpers
  - Anchor comment: `// === Shared sorting helpers ===`
  - Purpose: handover/task/user multi-sort and dashboard detail sorting.

- Chart rendering
  - Anchor comment: `// === Dashboard chart rendering ===`
  - Purpose: ECharts initialization and option building.

## CSS Areas

- Modal layering and dropdown overlays
  - Look for: `.modal-layer`, `.modal-backdrop`, `.searchable-select`, `.searchable-select-menu`
  - Common requests: dropdown covered, page blur stuck, dropdown appears only after outside click.

- Task layout and cards
  - Look for: `.task-layout`, `.task-form-card`, `.task-list-card`, `.notification-bell`
  - Common requests: new/edit modal layout, list spacing, responsive behavior.

- Tables and sort buttons
  - Look for: `.data-table`, `.sort-button`
  - Common requests: sortable column display and alignment.

## Cache Rule

When `static/app.js` or `static/styles.css` changes, update the `?v=` version in `templates/index.html`. Otherwise the browser may keep an old copy and make a fixed bug look unfixed.
