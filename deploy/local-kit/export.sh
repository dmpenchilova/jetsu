#!/bin/bash
# Выгрузить содержимое своей копии (страницы, разделы, настройки, пользователи, медиатека) в один файл,
# чтобы передать коллеге. Запуск: bash export.sh
set -e
cd "$(dirname "$0")/jetsu-main"
if [ -z "$(docker compose ps -q --status running admin 2>/dev/null)" ]; then
  echo "Копия не запущена. Сначала: bash start.sh"; exit 1
fi
STAMP=$(date +%Y-%m-%d_%H%M)
OUT="$(cd .. && pwd)/jetsu-content-$STAMP.tar.gz"
TMP=$(mktemp -d)
echo "== База"
docker compose exec -T db pg_dump -U jet -d jet_admin --format=custom --no-owner -f /tmp/db.dump
docker compose cp db:/tmp/db.dump "$TMP/db.dump" >/dev/null
docker compose exec -T db rm -f /tmp/db.dump
echo "== Медиатека"
docker compose exec -T admin tar -czf /tmp/media.tar.gz -C /app media
docker compose cp admin:/tmp/media.tar.gz "$TMP/media.tar.gz" >/dev/null
docker compose exec -T admin rm -f /tmp/media.tar.gz
tar -czf "$OUT" -C "$TMP" db.dump media.tar.gz
rm -rf "$TMP"
echo
echo "Готово: $OUT"
echo "Передайте этот файл коллеге — он загрузит его командой: bash import.sh <файл>"
