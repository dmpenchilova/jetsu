#!/bin/sh
# Восстановление из резервной копии — на боевом сервере после сбоя или на тестовом стенде (свежие данные с боевого).
#
#   ./restore.sh backups/db_2026-09-27_0300.dump backups/files_2026-09-27_0300.tar.gz
#   ./restore.sh --from-s3 2026-09-27_0300          # взять копию из облака (нужны S3_* в .env)
#   ./restore.sh --test db.dump files.tar.gz        # для тестового стенда: без заявок и файлов из них
#
# Запускать из папки deploy, рядом с docker-compose.prod.yml и .env.
set -eu
cd "$(dirname "$0")"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env"
# shellcheck disable=SC1091
set -a; . ./.env; set +a
DB_USER="${DB_USER:-jet}"
DB_NAME="${DB_NAME:-jet_admin}"

TEST=0
if [ "${1:-}" = "--test" ]; then TEST=1; shift; fi

if [ "${1:-}" = "--from-s3" ]; then
  stamp="${2:?Укажите дату копии, например 2026-09-27_0300}"
  mkdir -p restore-tmp
  for f in "db_$stamp.dump" "files_$stamp.tar.gz"; do
    $COMPOSE run --rm -v "$PWD/restore-tmp:/restore" --entrypoint sh backup -c \
      "apk add --no-cache aws-cli >/dev/null && AWS_ACCESS_KEY_ID=\$S3_ACCESS_KEY AWS_SECRET_ACCESS_KEY=\$S3_SECRET_KEY AWS_DEFAULT_REGION=\${S3_REGION:-ru-central1} aws --endpoint-url \${S3_ENDPOINT:-https://storage.yandexcloud.net} s3 cp s3://\$S3_BUCKET/\${S3_PREFIX:-}$f /restore/$f"
  done
  DB="restore-tmp/db_$stamp.dump"
  FILES="restore-tmp/files_$stamp.tar.gz"
else
  DB="${1:?Укажите файл базы db_….dump}"
  FILES="${2:-}"
fi

[ -f "$DB" ] || { echo "Нет файла $DB"; exit 1; }
echo "Будет восстановлено: база из $DB${FILES:+, файлы из $FILES}. Текущие данные на этом стенде будут заменены."
printf "Продолжить? (да/нет) "
read -r answer
[ "$answer" = "да" ] || { echo "Отменено"; exit 1; }

echo "== останавливаю сайт и админку"
$COMPOSE stop admin front

echo "== база"
$COMPOSE exec -T db pg_restore --clean --if-exists --no-owner -U "$DB_USER" -d "$DB_NAME" < "$DB"

if [ -n "$FILES" ]; then
  echo "== файлы"
  # тома медиатеки в сервисе backup подключены только для чтения — распаковываем через контейнер админки
  $COMPOSE run --rm --no-deps -u 0 -v "$PWD/$(dirname "$FILES"):/restore:ro" --entrypoint sh admin -c \
    "cd /app && tar -xzf /restore/$(basename "$FILES") && chown -R 1001:1001 /app/media /app/private-uploads"
fi

if [ "$TEST" = "1" ]; then
  echo "== тестовый стенд: удаляю заявки, файлы заявок и сессии пользователей"
  $COMPOSE exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE submissions, submission_files, poll_votes, search_queries, not_found_log RESTART IDENTITY CASCADE;
DELETE FROM users_sessions;
SQL
  $COMPOSE run --rm --no-deps -u 0 --entrypoint sh admin -c "rm -rf /app/private-uploads/*"
fi

echo "== запускаю"
$COMPOSE start admin front
echo "Готово. Если меняли стенд — проверьте STAND_NAME в .env (на тестовом: test)."
