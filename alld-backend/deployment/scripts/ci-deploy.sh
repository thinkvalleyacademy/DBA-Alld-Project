#!/bin/bash
# Runs ON the deploy server (invoked over SSH by GitHub Actions).
# Builds the current checkout and restarts one environment's backend
# container. Frontend static files are copied in place -- nginx reads
# them straight off disk, no container restart needed.
#
# Usage: ci-deploy.sh <branch> <env-dir> <app-port>
#   ci-deploy.sh dev  /home/dbadev01/dba-devv2  5602
#   ci-deploy.sh prod /home/dbadev01/dba-prodv3 6704

set -euo pipefail

BRANCH="$1"
ENV_DIR="$2"
APP_PORT="$3"

SRC_DIR="$ENV_DIR/src"

echo "==> Updating checkout ($SRC_DIR) to origin/$BRANCH"
cd "$SRC_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Building backend"
cd "$SRC_DIR/alld-backend"
./mvnw -B -q clean package -DskipTests

JAR="$(ls target/*.jar | head -1)"
cp "$JAR" "$ENV_DIR/backend/$(basename "$JAR")"

echo "==> Building frontend"
cd "$SRC_DIR/alld-frontend"
npm ci
CI=false npm run build
rsync -a --delete build/ "$ENV_DIR/frontend/current/"

echo "==> Restarting backend container"
cd "$ENV_DIR/backend"
docker compose up -d --force-recreate

echo "==> Waiting for health check on port $APP_PORT"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:${APP_PORT}/dba-alld/" || echo 000)
  if [ "$code" = "200" ] || [ "$code" = "401" ]; then
    echo "==> Backend responded HTTP $code -- deploy OK"
    exit 0
  fi
  sleep 3
done

echo "==> Backend did not become healthy in time (last code: ${code:-none})"
echo "==> Recent logs:"
docker logs --tail 60 "$(basename "$ENV_DIR")-backend" 2>&1 || true
exit 1
