#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/recipeops}"
BACKUP_FILE="${1:?Usage: ./restore.sh backups/recipes-YYYYMMDDTHHMMSSZ.sql.gz}"

cd "$APP_DIR"

gzip -dc "$BACKUP_FILE" | docker compose exec -T postgres psql -U recipes -d recipes
echo "Restored $BACKUP_FILE"

