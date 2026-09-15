#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ROOT="${1:-/home/dbadev01/app-deployment}"
KEEP_DAYS="${2:-14}"
DB_CONTAINER="${3:-dba-dev-db}"
ENV_FILE="$DEPLOY_ROOT/.env"
BACKUP_DIR="$DEPLOY_ROOT/backups/mysql"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

# Load DB variables from deployment env
set -a
source "$ENV_FILE"
set +a

: "${MYSQL_DATABASE:?MYSQL_DATABASE missing in .env}"
: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD missing in .env}"

mkdir -p "$BACKUP_DIR"

if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "MySQL container not running: $DB_CONTAINER"
  exit 1
fi

TS="$(date +%F_%H-%M-%S)"
OUT_FILE="$BACKUP_DIR/${MYSQL_DATABASE}_${TS}.sql.gz"
TMP_FILE="$BACKUP_DIR/.${MYSQL_DATABASE}_${TS}.sql.gz.part"

# Consistent logical dump suitable for restore and rollback.
docker exec "$DB_CONTAINER" sh -lc \
  "mysqldump -uroot -p\"$MYSQL_ROOT_PASSWORD\" --single-transaction --routines --events --triggers \"$MYSQL_DATABASE\"" \
  | gzip -9 > "$TMP_FILE"

mv "$TMP_FILE" "$OUT_FILE"
ln -sfn "$(basename "$OUT_FILE")" "$BACKUP_DIR/latest.sql.gz"

# Retention cleanup (default 14 days)
find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +"$KEEP_DAYS" -delete

echo "Backup created: $OUT_FILE"
