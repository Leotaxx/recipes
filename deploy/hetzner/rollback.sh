#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/recipeops}"
cd "$APP_DIR"

set -a
. ./.env
set +a

TARGET_COLOR="${ACTIVE_COLOR:?Set ACTIVE_COLOR to blue or green for rollback.}"

sed "s/\${ACTIVE_COLOR}/$TARGET_COLOR/g" nginx.conf.template > nginx.conf
docker compose up -d nginx
docker compose exec -T nginx nginx -s reload || docker compose restart nginx

cat > .env <<EOF
REGISTRY=$REGISTRY
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
APP_HTTP_PORT=${APP_HTTP_PORT:-80}
ACTIVE_COLOR=$TARGET_COLOR
BLUE_TAG=$BLUE_TAG
GREEN_TAG=$GREEN_TAG
EOF

echo "Traffic switched to $TARGET_COLOR."
