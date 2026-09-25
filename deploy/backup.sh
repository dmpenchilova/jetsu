#!/bin/sh
# Ночные резервные копии: база (pg_dump) и файлы (медиатека + файлы заявок).
# Копии лежат в папке BACKUP_DIR на сервере; старше BACKUP_KEEP_DAYS дней удаляются.
set -eu
KEEP="${BACKUP_KEEP_DAYS:-14}"
HOUR="${BACKUP_HOUR:-3}"

backup() {
  stamp=$(date +%Y-%m-%d_%H%M)
  echo "[backup] $stamp: база"
  pg_dump --format=custom --no-owner --file="/backups/db_$stamp.dump"
  echo "[backup] $stamp: файлы"
  tar -czf "/backups/files_$stamp.tar.gz" -C /data media private-uploads
  find /backups -type f \( -name 'db_*.dump' -o -name 'files_*.tar.gz' \) -mtime +"$KEEP" -delete
  echo "[backup] готово"
}

# при первом запуске — сразу копия, дальше каждую ночь в HOUR:00
backup
while true; do
  now=$(date +%s)
  next=$(date -d "$(date +%Y-%m-%d) $(printf %02d "$HOUR"):00" +%s 2>/dev/null || echo 0)
  if [ "$next" -le "$now" ]; then next=$((next + 86400)); fi
  if [ "$next" -le 86400 ]; then next=$((now + 86400)); fi
  sleep $((next - now))
  backup || echo "[backup] ошибка"
done
