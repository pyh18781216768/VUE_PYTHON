$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

Write-Host "Stopping existing Flask app.py processes..."
$processes = Get-CimInstance Win32_Process |
  Where-Object { $_.Name -eq "python.exe" -and $_.CommandLine -match "app.py" }

foreach ($process in $processes) {
  Stop-Process -Id $process.ProcessId -Force
}

Start-Sleep -Seconds 1

Write-Host "Starting Flask app..."
Start-Process `
  -FilePath python `
  -ArgumentList "app.py" `
  -WorkingDirectory $root `
  -RedirectStandardOutput "$root\server.stdout.log" `
  -RedirectStandardError "$root\server.stderr.log"

Start-Sleep -Seconds 2

Get-CimInstance Win32_Process |
  Where-Object { $_.Name -eq "python.exe" -and $_.CommandLine -match "app.py" } |
  Select-Object ProcessId, CommandLine
