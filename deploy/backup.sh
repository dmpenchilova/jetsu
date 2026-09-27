#!/bin/sh
# Ночные резервные копии: база (pg_dump) и файлы (медиатека + файлы заявок).
# Копии лежат в папке BACKUP_DIR на сервере; старше BACKUP_KEEP_DAYS дней удаляются.
#
# Копия в облако (S3-совместимое хранилище: Yandex Object Storage, VK Cloud, Selectel, MinIO):
#   S3_BUCKET=jetsu-backups  S3_ENDPOINT=https://storage.yandexcloud.net  S3_REGION=ru-central1
#   S3_ACCESS_KEY=…  S3_SECRET_KEY=…  S3_PREFIX=prod/   S3_KEEP_DAYS=90
# Если S3_BUCKET пуст — копии остаются только на сервере.
# Об ошибке копирования приходит оповещение (ALERT_TELEGRAM_BOT_TOKEN + ALERT_TELEGRAM_CHAT_ID).
set -eu
KEEP="${BACKUP_KEEP_DAYS:-14}"
HOUR="${BACKUP_HOUR:-3}"
S3_KEEP="${S3_KEEP_DAYS:-90}"
PREFIX="${S3_PREFIX:-}"

if [ -n "${S3_BUCKET:-}" ] && ! command -v aws >/dev/null 2>&1; then
  echo "[backup] ставлю aws-cli для выгрузки в облако"
  apk add --no-cache aws-cli >/dev/null
fi

s3() {
  AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" AWS_DEFAULT_REGION="${S3_REGION:-ru-central1}" \
    aws --endpoint-url "${S3_ENDPOINT:-https://storage.yandexcloud.net}" s3 "$@"
}

alert() {
  msg="⚠️ jet.su [${STAND_NAME:-prod}]: резервная копия — $1"
  echo "[backup] $msg"
  if [ -n "${ALERT_TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${ALERT_TELEGRAM_CHAT_ID:-}" ]; then
    wget -q -O /dev/null --post-data "chat_id=${ALERT_TELEGRAM_CHAT_ID}&text=${msg}" \
      "https://api.telegram.org/bot${ALERT_TELEGRAM_BOT_TOKEN}/sendMessage" || true
  fi
}

upload() {
  [ -n "${S3_BUCKET:-}" ] || return 0
  for f in "$@"; do
    s3 cp --only-show-errors "$f" "s3://${S3_BUCKET}/${PREFIX}$(basename "$f")" || return 1
  done
  # старые копии в облаке: удаляем файлы старше S3_KEEP_DAYS (можно вместо этого настроить правило жизненного цикла бакета)
  limit=$(date -d "@$(( $(date +%s) - S3_KEEP * 86400 ))" +%Y-%m-%d 2>/dev/null || echo "")
  [ -n "$limit" ] || return 0
  s3 ls "s3://${S3_BUCKET}/${PREFIX}" 2>/dev/null | while read -r _d _t _s name; do
    day=$(echo "$name" | sed -n 's/^[a-z]*_\([0-9-]\{10\}\)_.*/\1/p')
    if [ -n "$day" ] && [ "$day" \< "$limit" ]; then s3 rm --only-show-errors "s3://${S3_BUCKET}/${PREFIX}${name}"; fi
  done
}

backup() {
  stamp=$(date +%Y-%m-%d_%H%M)
  db="/backups/db_$stamp.dump"
  files="/backups/files_$stamp.tar.gz"
  echo "[backup] $stamp: база"
  # функция вызывается внутри «|| alert», где set -e не действует, поэтому каждую ошибку проверяем явно
  pg_dump --format=custom --no-owner --file="$db" || return 1
  echo "[backup] $stamp: файлы"
  tar -czf "$files" -C /data media private-uploads || return 1
  # проверка, что копия читается
  pg_restore --list "$db" >/dev/null || return 1
  tar -tzf "$files" >/dev/null || return 1
  find /backups -type f \( -name 'db_*.dump' -o -name 'files_*.tar.gz' \) -mtime +"$KEEP" -delete
  if [ -n "${S3_BUCKET:-}" ]; then
    echo "[backup] $stamp: выгрузка в облако s3://${S3_BUCKET}/${PREFIX}"
    upload "$db" "$files" || { alert "не удалось выгрузить в облако"; return 1; }
  fi
  date +%s > /backups/.last-ok
  echo "[backup] готово"
}

# разовый запуск: sh backup.sh once
if [ "${1:-}" = "once" ]; then
  backup || { alert "ошибка разовой копии"; exit 1; }
  exit 0
fi

# при первом запуске — сразу копия, дальше каждую ночь в HOUR:00
backup || alert "ошибка ночной копии"
while true; do
  now=$(date +%s)
  next=$(date -d "$(date +%Y-%m-%d) $(printf %02d "$HOUR"):00" +%s 2>/dev/null || echo 0)
  if [ "$next" -le "$now" ]; then next=$((next + 86400)); fi
  if [ "$next" -le 86400 ]; then next=$((now + 86400)); fi
  sleep $((next - now))
  backup || alert "ошибка ночной копии"
done
