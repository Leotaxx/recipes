#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/recipeops}"
IMAGE_TAG="${IMAGE_TAG:?Set IMAGE_TAG to the image tag to deploy.}"
REGISTRY="${REGISTRY:-ghcr.io/leotaxx/recipes}"

cd "$APP_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
fi

set -a
. ./.env
set +a

CURRENT_COLOR="${ACTIVE_COLOR:-blue}"
if [ "$CURRENT_COLOR" = "blue" ]; then
  NEXT_COLOR="green"
else
  NEXT_COLOR="blue"
fi

if [ "$NEXT_COLOR" = "blue" ]; then
  BLUE_TAG="$IMAGE_TAG"
else
  GREEN_TAG="$IMAGE_TAG"
fi

write_env() {
  cat > .env <<EOF
REGISTRY=$REGISTRY
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
APP_HTTP_PORT=${APP_HTTP_PORT:-80}
ACTIVE_COLOR=$1
BLUE_TAG=$BLUE_TAG
GREEN_TAG=$GREEN_TAG
EOF
}

write_nginx() {
  sed "s/\${ACTIVE_COLOR}/$1/g" nginx.conf.template > nginx.conf
}

healthcheck() {
  local color="$1"
  local frontend="frontend-$color"
  local catalog="catalog-$color"
  local recommendation="recommendation-$color"

  docker compose --profile "$color" exec -T "$catalog" wget -qO- http://localhost:3001/health
  docker compose --profile "$color" exec -T "$catalog" wget -qO- http://localhost:3001/recipes
  docker compose --profile "$color" exec -T "$recommendation" python - <<'PY'
import urllib.request
print(urllib.request.urlopen("http://localhost:3002/health", timeout=10).read().decode())
PY
  docker compose --profile "$color" exec -T "$frontend" wget -qO- http://localhost:8080 >/dev/null
}

write_env "$CURRENT_COLOR"
write_nginx "$CURRENT_COLOR"

docker compose --profile "$NEXT_COLOR" pull
docker compose --profile "$NEXT_COLOR" up -d postgres "catalog-$NEXT_COLOR" "recommendation-$NEXT_COLOR" "frontend-$NEXT_COLOR"

sleep 8
healthcheck "$NEXT_COLOR"

write_env "$NEXT_COLOR"
write_nginx "$NEXT_COLOR"
docker compose up -d nginx
docker compose exec -T nginx nginx -s reload || docker compose restart nginx

echo "Deployed $IMAGE_TAG to $NEXT_COLOR. Previous active color was $CURRENT_COLOR."
echo "Rollback: ACTIVE_COLOR=$CURRENT_COLOR ./rollback.sh"
