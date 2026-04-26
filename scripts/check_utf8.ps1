$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$textExtensions = @(
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".ps1",
  ".py",
  ".txt"
)

Write-Host "Checking UTF-8 text files..."

$files = Get-ChildItem -Path $root -Recurse -File |
  Where-Object {
    $extension = $_.Extension.ToLowerInvariant()
    $textExtensions -contains $extension -and
    $_.FullName -notmatch "\\.git\\" -and
    $_.FullName -notmatch "\\.venv\\" -and
    $_.FullName -notmatch "\\node_modules\\"
  }

$failed = @()
$replacementWarnings = @()

foreach ($file in $files) {
  $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
  $decoder = [System.Text.UTF8Encoding]::new($false, $true)
  try {
    $text = $decoder.GetString($bytes)
  } catch {
    $failed += $file.FullName
    continue
  }

  if ($text.Contains([char]0xFFFD)) {
    $replacementWarnings += $file.FullName
  }
}

if ($failed.Count -gt 0) {
  Write-Host "Files that are not valid UTF-8:"
  $failed | ForEach-Object { Write-Host " - $_" }
  exit 1
}

if ($replacementWarnings.Count -gt 0) {
  Write-Host "Files containing the Unicode replacement character:"
  $replacementWarnings | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "UTF-8 check passed."
