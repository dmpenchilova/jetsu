# Остановить сайт и админку. Данные сохраняются.
Set-Location (Join-Path $PSScriptRoot 'jetsu-main')
docker compose stop
