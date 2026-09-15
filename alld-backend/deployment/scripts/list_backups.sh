#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ROOT="${1:-/home/dbadev01/app-deployment}"
BACKUP_DIR="$DEPLOY_ROOT/backups/mysql"

if [[ ! -d "$BACKUP_DIR" ]]; then
  echo "Backup directory not found: $BACKUP_DIR"
  exit 0
fi

ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found in $BACKUP_DIR"
