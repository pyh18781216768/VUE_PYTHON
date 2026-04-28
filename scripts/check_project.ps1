$ErrorActionPreference = "Stop"

& "$PSScriptRoot\check_utf8.ps1"

if (Test-Path frontend\package.json) {
  Write-Host "Checking Vue frontend build..."
  npm --prefix frontend run build
}

Write-Host "Checking Python files..."
python -m py_compile `
  app.py `
  fab_app\controllers\auth_controller.py `
  fab_app\controllers\dashboard_controller.py `
  fab_app\controllers\task_controller.py `
  fab_app\controllers\web_controller.py `
  fab_app\repositories\dashboard_repository.py `
  fab_app\repositories\task_repository.py `
  fab_app\repositories\user_repository.py `
  fab_app\services\dashboard_service.py `
  fab_app\services\export_service.py `
  fab_app\services\task_export_service.py `
  fab_app\services\task_system_service.py `
  fab_app\services\user_service.py

Write-Host "Checking git diff whitespace..."
git diff --check

Write-Host "All checks passed."
