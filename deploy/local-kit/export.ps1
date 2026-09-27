# Выгрузить содержимое своей копии в один файл, чтобы передать коллеге (Windows).
# Запуск: правой кнопкой -> «Выполнить с помощью PowerShell»
Set-Location (Join-Path $PSScriptRoot 'jetsu-main')
if (-not (docker compose ps -q --status running admin)) { Write-Host 'Копия не запущена. Сначала запустите start.ps1'; Read-Host 'Нажмите Enter'; exit 1 }
$stamp = Get-Date -Format 'yyyy-MM-dd_HHmm'
$out = Join-Path $PSScriptRoot "jetsu-content-$stamp.tar.gz"
$tmp = Join-Path $env:TEMP "jetsu-export-$stamp"
New-Item -ItemType Directory -Force $tmp | Out-Null
Write-Host '== База'
docker compose exec -T db pg_dump -U jet -d jet_admin --format=custom --no-owner -f /tmp/db.dump
docker compose cp db:/tmp/db.dump (Join-Path $tmp 'db.dump') | Out-Null
docker compose exec -T db rm -f /tmp/db.dump
Write-Host '== Медиатека'
docker compose exec -T admin tar -czf /tmp/media.tar.gz -C /app media
docker compose cp admin:/tmp/media.tar.gz (Join-Path $tmp 'media.tar.gz') | Out-Null
docker compose exec -T admin rm -f /tmp/media.tar.gz
tar -czf $out -C $tmp db.dump media.tar.gz
Remove-Item -Recurse -Force $tmp
Write-Host ''
Write-Host "Готово: $out"
Write-Host 'Передайте этот файл коллеге — он загрузит его через import.ps1'
Read-Host 'Нажмите Enter, чтобы закрыть окно'
