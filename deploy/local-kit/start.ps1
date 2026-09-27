# Запуск сайта и админки jet.su на своём компьютере (Windows).
# Запуск: правой кнопкой по файлу -> «Выполнить с помощью PowerShell»
# или в PowerShell:  powershell -ExecutionPolicy Bypass -File start.ps1
Set-Location (Join-Path $PSScriptRoot 'jetsu-main')

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Docker Desktop не запущен или не установлен. Запустите его и повторите.'
  Read-Host 'Нажмите Enter'; exit 1
}

if (-not (Test-Path .env)) {
  $secret = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
  [IO.File]::WriteAllText((Join-Path (Get-Location) '.env'), "PAYLOAD_SECRET=$secret`nREVALIDATE_SECRET=dev-secret`n")
  Write-Host 'Создан файл настроек jetsu-main\.env'
}

function Wait-Url($url, $tries, $pause) {
  for ($i = 0; $i -lt $tries; $i++) {
    try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 $url | Out-Null; return $true } catch { Start-Sleep -Seconds $pause }
  }
  return $false
}

Write-Host '== Сборка и запуск (первый раз 10–15 минут)'
docker compose up -d --build

Write-Host '== Жду админку'
if (-not (Wait-Url 'http://localhost:3001/cms-api/health' 120 5)) {
  Write-Host 'Админка не запустилась. Журнал: docker compose logs admin --tail 50'
  Read-Host 'Нажмите Enter'; exit 1
}

if (-not (Test-Path .fixtures-imported)) {
  Write-Host '== Загружаю тестовые данные'
  docker compose --profile tools build tools
  docker compose run --rm tools npm run import:fixtures
  if ($LASTEXITCODE -eq 0) { New-Item .fixtures-imported -ItemType File | Out-Null }
}

Write-Host '== Жду сайт (первая сборка сайта 5–10 минут)'
Wait-Url 'http://localhost:3000/' 180 10 | Out-Null

Write-Host ''
Write-Host 'Готово:'
Write-Host '  админка        http://localhost:3001/admin   (первый зарегистрированный пользователь — администратор)'
Write-Host '  сайт           http://localhost:3000'
Write-Host '  тестовая почта http://localhost:8025'
Start-Process 'http://localhost:3001/admin'
Read-Host 'Нажмите Enter, чтобы закрыть окно'
