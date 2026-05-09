#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/recipeops}"
REQUESTED_COLOR="${1:-${ACTIVE_COLOR:-}}"

cd "$APP_DIR"

set -a
. ./.env
set +a

CURRENT_COLOR="${ACTIVE_COLOR:?ACTIVE_COLOR is not set in .env.}"

if [ -n "$REQUESTED_COLOR" ]; then
  TARGET_COLOR="$REQUESTED_COLOR"
elif [ "$CURRENT_COLOR" = "blue" ]; then
  TARGET_COLOR="green"
else
  TARGET_COLOR="blue"
fi

if [ "$TARGET_COLOR" != "blue" ] && [ "$TARGET_COLOR" != "green" ]; then
  echo "TARGET_COLOR must be blue or green. Received: $TARGET_COLOR" >&2
  exit 1
fi

sed "s/\${ACTIVE_COLOR}/$TARGET_COLOR/g" nginx.conf.template > nginx.conf
docker compose up -d --force-recreate nginx
docker compose exec -T nginx nginx -s reload || docker compose restart nginx

cat > .env <<EOF
REGISTRY=$REGISTRY
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
APP_HTTP_PORT=${APP_HTTP_PORT:-80}
ACTIVE_COLOR=$TARGET_COLOR
BLUE_TAG=$BLUE_TAG
GREEN_TAG=$GREEN_TAG
EOF

echo "Traffic switched from $CURRENT_COLOR to $TARGET_COLOR."
