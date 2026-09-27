#!/bin/bash
# Запуск сайта и админки jet.su на своём компьютере (macOS / Linux).
# Запуск:  bash start.sh
set -e
cd "$(dirname "$0")/jetsu-main"

if ! command -v docker >/dev/null 2>&1; then
  echo "Не найден Docker. Установите Docker Desktop: https://www.docker.com/products/docker-desktop/"; exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "Docker Desktop не запущен. Запустите его, дождитесь, пока значок кита перестанет мигать, и повторите."; exit 1
fi

# настройки админки: секрет генерируется один раз
if [ ! -f .env ]; then
  SECRET=$(openssl rand -hex 32 2>/dev/null || LC_ALL=C tr -dc a-f0-9 </dev/urandom | head -c 64)
  printf 'PAYLOAD_SECRET=%s\nREVALIDATE_SECRET=dev-secret\n' "$SECRET" > .env
  echo "Создан файл настроек jetsu-main/.env"
fi

echo "== Сборка и запуск (первый раз 10–15 минут)"
docker compose up -d --build

echo "== Жду админку"
for i in $(seq 1 120); do curl -sf http://localhost:3001/cms-api/health >/dev/null && break; sleep 5; done
curl -sf http://localhost:3001/cms-api/health >/dev/null || { echo "Админка не запустилась. Журнал: docker compose logs admin --tail 50"; exit 1; }

# тестовые данные — только при первом запуске
if [ ! -f .fixtures-imported ]; then
  echo "== Загружаю тестовые данные"
  docker compose --profile tools build tools
  docker compose run --rm tools npm run import:fixtures
  touch .fixtures-imported
fi

echo "== Жду сайт (первая сборка сайта 5–10 минут)"
for i in $(seq 1 180); do curl -sf -o /dev/null http://localhost:3000/ && break; sleep 10; done

echo
echo "Готово:"
echo "  админка        http://localhost:3001/admin   (первый зарегистрированный пользователь — администратор)"
echo "  сайт           http://localhost:3000"
echo "  тестовая почта http://localhost:8025         (сюда приходят письма о заявках)"
command -v open >/dev/null && open http://localhost:3001/admin || true
