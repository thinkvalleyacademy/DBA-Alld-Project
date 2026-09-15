#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file.sql.gz|backup-file.sql> [deploy-root] [db-container] [backend-container]"
  exit 1
fi

BACKUP_FILE="$1"
DEPLOY_ROOT="${2:-/home/dbadev01/app-deployment}"
DB_CONTAINER="${3:-dba-dev-db}"
BACKEND_CONTAINER="${4:-dba-dev-backend}"
ENV_FILE="$DEPLOY_ROOT/.env"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

: "${MYSQL_DATABASE:?MYSQL_DATABASE missing in .env}"
: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD missing in .env}"

if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "MySQL container not running: $DB_CONTAINER"
  exit 1
fi

# Safety backup before restore for quick rollback of rollback action itself.
"$(dirname "$0")/backup_db.sh" "$DEPLOY_ROOT" 14 "$DB_CONTAINER"

docker stop "$BACKEND_CONTAINER" >/dev/null 2>&1 || true

# Recreate target database and restore dump.
docker exec "$DB_CONTAINER" sh -lc \
  "mysql -uroot -p\"$MYSQL_ROOT_PASSWORD\" -e 'DROP DATABASE IF EXISTS \\\`$MYSQL_DATABASE\\\`; CREATE DATABASE \\\`$MYSQL_DATABASE\\\`; '"

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" sh -lc "mysql -uroot -p\"$MYSQL_ROOT_PASSWORD\" \"$MYSQL_DATABASE\""
else
  cat "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" sh -lc "mysql -uroot -p\"$MYSQL_ROOT_PASSWORD\" \"$MYSQL_DATABASE\""
fi

docker start "$BACKEND_CONTAINER" >/dev/null 2>&1 || true

echo "Restore completed from: $BACKUP_FILE"
