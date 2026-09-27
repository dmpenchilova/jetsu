#!/bin/bash
# Остановить сайт и админку. Данные сохраняются, следующий запуск — bash start.sh
cd "$(dirname "$0")/jetsu-main" && docker compose stop
