# Налаштування DNS dimarket.market → Vercel через Name.com API
# Потрібно: API token з https://www.name.com/account/settings/api
# Запуск: $env:NAMECOM_API_TOKEN = "ваш_токен"; .\scripts\fix-dns-namecom.ps1

param(
  [string]$Domain = "dimarket.market",
  [string]$Username = $env:NAMECOM_USERNAME,
  [string]$ApiToken = $env:NAMECOM_API_TOKEN
)

if (-not $ApiToken) {
  Write-Error "Встановіть NAMECOM_API_TOKEN (і опційно NAMECOM_USERNAME — логін Name.com)."
  exit 1
}

if (-not $Username) {
  Write-Host "NAMECOM_USERNAME не задано — спробуємо лише з API token як username (деякі акаунти так працюють)."
  $Username = $ApiToken
}

$pair = "${Username}:${ApiToken}"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$basic = [Convert]::ToBase64String($bytes)
$headers = @{
  Authorization = "Basic $basic"
  "Content-Type" = "application/json"
}

$nameservers = @{
  nameservers = @("ns1.vercel-dns.com", "ns2.vercel-dns.com")
}

$uri = "https://api.name.com/v4/domains/${Domain}:setNameservers"
Write-Host "Оновлюємо nameservers на Vercel для $Domain ..."

try {
  $r = Invoke-RestMethod -Method POST -Uri $uri -Headers $headers -Body ($nameservers | ConvertTo-Json)
  Write-Host "OK:" ($r | ConvertTo-Json -Compress)
  Write-Host ""
  Write-Host "Зачекайте 5–30 хв, потім перевірте: https://www.dimarket.market/build-id.txt"
} catch {
  Write-Error $_.Exception.Message
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  exit 1
}
