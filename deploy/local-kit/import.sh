#!/bin/bash
# Загрузить в свою копию содержимое, выгруженное коллегой (export.sh).
# ВНИМАНИЕ: всё содержимое вашей копии будет заменено, включая пользователей.
# Запуск: bash import.sh jetsu-content-<дата>.tar.gz   (без имени — самый свежий файл в папке jetsu-local)
set -e
FILE="$1"
# без имени — самый свежий jetsu-content-*.tar.gz рядом со скриптом
[ -n "$FILE" ] || FILE=$(ls -t "$(dirname "$0")"/jetsu-content-*.tar.gz 2>/dev/null | head -1)
[ -n "$FILE" ] && [ -f "$FILE" ] || { echo "Укажите файл: bash import.sh jetsu-content-<дата>.tar.gz"; exit 1; }
FILE="$(cd "$(dirname "$FILE")" && pwd)/$(basename "$FILE")"
cd "$(dirname "$0")/jetsu-main"
if [ -z "$(docker compose ps -q --status running admin 2>/dev/null)" ]; then
  echo "Копия не запущена. Сначала: bash start.sh"; exit 1
fi
printf "Всё содержимое вашей копии будет заменено содержимым из файла. Продолжить? (да/нет) "
read -r answer
[ "$answer" = "да" ] || { echo "Отменено"; exit 1; }
TMP=$(mktemp -d)
tar -xzf "$FILE" -C "$TMP"
[ -f "$TMP/db.dump" ] || { echo "В файле нет выгрузки базы — это точно файл из export.sh?"; exit 1; }
echo "== Останавливаю админку и сайт"
docker compose stop admin front >/dev/null
echo "== База"
docker compose cp "$TMP/db.dump" db:/tmp/db.dump >/dev/null
docker compose exec -T db pg_restore --clean --if-exists --no-owner -U jet -d jet_admin /tmp/db.dump \
  || echo "(pg_restore сообщил о предупреждениях — обычно это не страшно)"
docker compose exec -T db rm -f /tmp/db.dump
if [ -f "$TMP/media.tar.gz" ]; then
  echo "== Медиатека"
  docker compose run --rm --no-deps -u 0 -v "$TMP:/restore:ro" --entrypoint sh admin \
    -c 'rm -rf /app/media/* && tar -xzf /restore/media.tar.gz -C /app && chown -R 1001:1001 /app/media'
fi
rm -rf "$TMP"
echo "== Запуск"
docker compose start admin front >/dev/null
for i in $(seq 1 60); do curl -sf http://localhost:3001/cms-api/health >/dev/null && break; sleep 3; done
for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:3000/api/revalidate/?tag=revalidate&secret=dev-secret" && break; sleep 3; done
echo
echo "Готово. Входите в админку под учётной записью коллеги, от которого получен файл."
