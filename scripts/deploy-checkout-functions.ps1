# Деплой Stripe edge functions на prod
# Потрібно: SUPABASE_ACCESS_TOKEN у .env.local
# Після деплою: supabase secrets set STRIPE_SECRET_KEY=sk_... (Dashboard або CLI)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

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
  Write-Host 'Додайте SUPABASE_ACCESS_TOKEN у .env.local' -ForegroundColor Red
  exit 1
}

$env:SUPABASE_ACCESS_TOKEN = $token
npx supabase functions deploy create-checkout-session verify-checkout-session --project-ref wjlfvajloxkevggwjgtk
Write-Host 'Готово. Перевірте: npm run db:verify-prod-ads' -ForegroundColor Green
