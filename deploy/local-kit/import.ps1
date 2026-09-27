# Загрузить в свою копию содержимое, выгруженное коллегой (Windows).
# ВНИМАНИЕ: всё содержимое вашей копии будет заменено, включая пользователей.
# Запуск в PowerShell:  powershell -ExecutionPolicy Bypass -File import.ps1 jetsu-content-<дата>.tar.gz
# Без имени файла скрипт возьмёт самый свежий jetsu-content-*.tar.gz из этой папки.
param([string]$File)
if (-not $File) { $File = (Get-ChildItem (Join-Path $PSScriptRoot 'jetsu-content-*.tar.gz') -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 1).FullName }
if (-not $File -or -not (Test-Path $File)) { Write-Host 'Не найден файл jetsu-content-*.tar.gz. Положите его в папку jetsu-local или укажите путь.'; Read-Host 'Нажмите Enter'; exit 1 }
$File = (Resolve-Path $File).Path
Set-Location (Join-Path $PSScriptRoot 'jetsu-main')
if (-not (docker compose ps -q --status running admin)) { Write-Host 'Копия не запущена. Сначала запустите start.ps1'; Read-Host 'Нажмите Enter'; exit 1 }
Write-Host "Файл: $File"
$answer = Read-Host 'Всё содержимое вашей копии будет заменено. Продолжить? (да/нет)'
if ($answer -ne 'да') { Write-Host 'Отменено'; exit 1 }
$tmp = Join-Path $env:TEMP ("jetsu-import-" + (Get-Date -Format 'yyyyMMddHHmmss'))
New-Item -ItemType Directory -Force $tmp | Out-Null
tar -xzf $File -C $tmp
if (-not (Test-Path (Join-Path $tmp 'db.dump'))) { Write-Host 'В файле нет выгрузки базы — это точно файл из export?'; exit 1 }
Write-Host '== Останавливаю админку и сайт'
docker compose stop admin front | Out-Null
Write-Host '== База'
docker compose cp (Join-Path $tmp 'db.dump') db:/tmp/db.dump | Out-Null
docker compose exec -T db pg_restore --clean --if-exists --no-owner -U jet -d jet_admin /tmp/db.dump
docker compose exec -T db rm -f /tmp/db.dump
if (Test-Path (Join-Path $tmp 'media.tar.gz')) {
  Write-Host '== Медиатека'
  docker compose run --rm --no-deps -u 0 -v "${tmp}:/restore:ro" --entrypoint sh admin -c 'rm -rf /app/media/* && tar -xzf /restore/media.tar.gz -C /app && chown -R 1001:1001 /app/media'
}
Remove-Item -Recurse -Force $tmp
Write-Host '== Запуск'
docker compose start admin front | Out-Null
for ($i = 0; $i -lt 60; $i++) { try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 'http://localhost:3001/cms-api/health' | Out-Null; break } catch { Start-Sleep 3 } }
for ($i = 0; $i -lt 60; $i++) { try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 'http://localhost:3000/api/revalidate/?tag=revalidate&secret=dev-secret' | Out-Null; break } catch { Start-Sleep 3 } }
Write-Host ''
Write-Host 'Готово. Входите в админку под учётной записью коллеги, от которого получен файл.'
Read-Host 'Нажмите Enter, чтобы закрыть окно'
