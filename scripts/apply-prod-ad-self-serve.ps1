# Застосовує scripts/prod-ad-self-serve-remaining.sql на prod
# Потрібно: SUPABASE_ACCESS_TOKEN (sbp_...) у .env.local

param(
  [string]$ProjectRef = 'wjlfvajloxkevggwjgtk'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$sqlPath = Join-Path $root 'scripts\prod-ad-self-serve-remaining.sql'
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
  Write-Host 'Додайте SUPABASE_ACCESS_TOKEN у .env.local (https://supabase.com/dashboard/account/tokens)' -ForegroundColor Red
  Write-Host 'Або вставте scripts/prod-ad-self-serve-remaining.sql у Supabase SQL Editor вручну.' -ForegroundColor Yellow
  exit 1
}

$uri = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$body = @{ query = $sql } | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri $uri -Method POST -Headers @{
  Authorization = "Bearer $token"
  'Content-Type' = 'application/json'
} -Body $body | Out-Null

Write-Host 'SQL застосовано. Перевірка:' -ForegroundColor Green
Set-Location $root
node scripts/verify-prod-ad-schema.mjs
