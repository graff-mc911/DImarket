# Застосовує supabase/migrations/20260519140000_paid_ad_campaigns_display.sql
# Потрібно: SUPABASE_ACCESS_TOKEN (sbp_...) у .env.local або змінних середовища
# Отримати: https://supabase.com/dashboard/account/tokens

param(
  [string]$ProjectRef = 'wjlfvajloxkevggwjgtk'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$sqlPath = Join-Path $root 'supabase\migrations\20260519140000_paid_ad_campaigns_display.sql'
$sql = Get-Content $sqlPath -Raw

$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token) {
  $envFile = Join-Path $root '.env.local'
  if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
      if ($_ -match '^\s*SUPABASE_ACCESS_TOKEN\s*=\s*(.+)\s*$') {
        $token = $matches[1].Trim().Trim('"').Trim("'")
      }
    }
  }
}

if (-not $token) {
  Write-Host 'Додайте SUPABASE_ACCESS_TOKEN у .env.local (Dashboard → Account → Access Tokens)' -ForegroundColor Red
  exit 1
}

$uri = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$body = @{ query = $sql } | ConvertTo-Json -Depth 3

$response = Invoke-RestMethod -Uri $uri -Method POST -Headers @{
  Authorization = "Bearer $token"
  'Content-Type' = 'application/json'
} -Body $body

Write-Host 'Міграцію застосовано успішно.' -ForegroundColor Green
$response | ConvertTo-Json -Depth 4
