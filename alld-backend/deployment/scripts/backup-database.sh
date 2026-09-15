#!/bin/bash
# ================================================================
# DBA ALLD - Automated Database Backup Script
# Scheduled Backup with Retention Policy
# ================================================================
# Usage: ./backup-database.sh [dev|prod|local] [full|incremental]
# ================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/database/backups"
LOG_DIR="$PROJECT_ROOT/database/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_ONLY=$(date +"%Y%m%d")

# Retention policy (days)
RETENTION_DAYS=30
MIN_BACKUPS=7

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Environment configuration
configure_environment() {
    local ENV=$1
    
    if [ "$ENV" == "dev" ]; then
        DB_HOST="localhost"
        DB_PORT="3307"
        DB_USER="rwroot"
        DB_PASSWORD="root"
        DB_NAME="dba"
        ENV_NAME="Development"
    elif [ "$ENV" == "prod" ]; then
        DB_HOST="localhost"
        DB_PORT="5307"
        DB_USER="rwroot"
        DB_PASSWORD="${PROD_DB_PASSWORD:-root}"
        DB_NAME="dba"
        ENV_NAME="Production"
    elif [ "$ENV" == "local" ]; then
        DB_HOST="localhost"
        DB_PORT="3307"
        DB_USER="rwroot"
        DB_PASSWORD="root"
        DB_NAME="dba"
        ENV_NAME="Local"
    else
        echo -e "${RED}Error: Invalid environment '$ENV'${NC}"
        exit 1
    fi
}

log() {
    local LEVEL=$1
    shift
    local MESSAGE="$@"
    local TS=$(date +"%Y-%m-%d %H:%M:%S")
    echo -e "${BLUE}[$TS]${NC} ${GREEN}[INFO]${NC} $MESSAGE"
    mkdir -p "$LOG_DIR"
    echo "[$TS] [$LEVEL] $MESSAGE" >> "$LOG_DIR/backup_$DATE_ONLY.log"
}

# Create backup
create_backup() {
    local BACKUP_TYPE=${1:-full}
    local BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql"
    
    log "INFO" "Starting $BACKUP_TYPE backup for $ENV_NAME environment"
    log "INFO" "Target file: $BACKUP_FILE"
    
    mkdir -p "$BACKUP_DIR"
    
    # Full backup with all database objects
    if docker run --rm --network host \
        -v "$BACKUP_DIR":/backup \
        mysql:8.0 \
        mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --set-gtid-purged=OFF \
        --quick \
        --lock-tables=false \
        "$DB_NAME" > "$BACKUP_FILE" 2>&1; then
        
        # Compress backup
        gzip "$BACKUP_FILE"
        local COMPRESSED_FILE="${BACKUP_FILE}.gz"
        
        # Get backup size
        local BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        
        log "INFO" "Backup completed successfully ✓"
        log "INFO" "Compressed file: $COMPRESSED_FILE"
        log "INFO" "Backup size: $BACKUP_SIZE"
        
        # Create checksum
        sha256sum "$COMPRESSED_FILE" > "${COMPRESSED_FILE}.sha256"
        log "INFO" "Checksum created: ${COMPRESSED_FILE}.sha256"
        
        # Verify backup
        if verify_backup "$COMPRESSED_FILE"; then
            log "INFO" "Backup verification passed ✓"
        else
            log "ERROR" "Backup verification failed!"
            exit 1
        fi
        
        return 0
    else
        log "ERROR" "Backup failed!"
        return 1
    fi
}

# Verify backup integrity
verify_backup() {
    local BACKUP_FILE="$1"
    
    if gzip -t "$BACKUP_FILE" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "INFO" "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Find and remove old backups (keep minimum)
    local BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
    
    if [ "$BACKUP_COUNT" -gt "$MIN_BACKUPS" ]; then
        local OLD_BACKUPS=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -type f)
        
        if [ -n "$OLD_BACKUPS" ]; then
            echo "$OLD_BACKUPS" | while read -r FILE; do
                log "INFO" "Removing old backup: $FILE"
                rm -f "$FILE" "${FILE}.sha256"
            done
            log "INFO" "Cleanup completed ✓"
        else
            log "INFO" "No backups older than $RETENTION_DAYS days found"
        fi
    else
        log "INFO" "Keeping all backups (count: $BACKUP_COUNT, minimum: $MIN_BACKUPS)"
    fi
}

# List available backups
list_backups() {
    echo "=========================================="
    echo "Available Backups for $ENV_NAME"
    echo "=========================================="
    
    if [ -d "$BACKUP_DIR" ]; then
        ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -20 || echo "No backups found"
    else
        echo "Backup directory not found"
    fi
    
    echo "=========================================="
}

# Main
main() {
    local ENV=${1:-local}
    local ACTION=${2:-backup}
    
    echo "=========================================="
    echo "DBA ALLD Database Backup Tool"
    echo "Environment: $ENV"
    echo "=========================================="
    
    configure_environment "$ENV"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    
    case $ACTION in
        backup|full)
            create_backup "full"
            cleanup_old_backups
            ;;
        incremental)
            log "WARN" "Incremental backup not supported. Creating full backup..."
            create_backup "full"
            cleanup_old_backups
            ;;
        list)
            list_backups
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        *)
            echo "Usage: $0 [dev|prod|local] [backup|list|cleanup]"
            exit 1
            ;;
    esac
}

main "$@"
