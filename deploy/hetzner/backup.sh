#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/recipeops}"
cd "$APP_DIR"

mkdir -p backups
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
docker compose exec -T postgres pg_dump -U recipes -d recipes | gzip > "backups/recipes-$stamp.sql.gz"

find backups -name 'recipes-*.sql.gz' -mtime +7 -delete
echo "Created backups/recipes-$stamp.sql.gz"

