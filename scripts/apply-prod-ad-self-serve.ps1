# Застосувати SQL для self-serve реклами на prod Supabase (wjlfvajloxkevggwjgtk)
# Потрібно: SUPABASE_ACCESS_TOKEN у .env.local
# Dashboard → SQL Editor: можна вставити вміст supabase/migrations/20260529120000_ensure_geo_catalog_for_ads.sql
# та 20260529140000_production_self_serve_ads.sql

param(
  [string]$ProjectRef = 'wjlfvajloxkevggwjgtk'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$files = @(
  'supabase\migrations\20260529120000_ensure_geo_catalog_for_ads.sql',
  'supabase\migrations\20260529140000_production_self_serve_ads.sql'
)

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
  Write-Host 'Додайте SUPABASE_ACCESS_TOKEN у .env.local або виконайте SQL вручну в Supabase Dashboard.' -ForegroundColor Yellow
  exit 1
}

$uri = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"

foreach ($rel in $files) {
  $sqlPath = Join-Path $root $rel
  $sql = Get-Content $sqlPath -Raw
  Write-Host "Applying $rel ..." -ForegroundColor Cyan
  $body = @{ query = $sql } | ConvertTo-Json -Depth 3
  Invoke-RestMethod -Uri $uri -Method POST -Headers @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
  } -Body $body | Out-Null
}

Write-Host 'Done. Deploy edge functions: npx supabase functions deploy create-checkout-session verify-checkout-session' -ForegroundColor Green
