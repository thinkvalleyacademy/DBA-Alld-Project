#!/bin/bash
# ================================================================
# DBA ALLD - Database Migration Script (Docker-based)
# Zero-Downtime Migration with Backup & Rollback Support
# ================================================================
# Usage: ./migrate-database.sh [dev|prod] [backup|restore|migrate|status]
# ================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/database/migrations"
BACKUP_DIR="$PROJECT_ROOT/database/backups"
LOG_DIR="$PROJECT_ROOT/database/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment-specific configuration
configure_environment() {
    local ENV=$1
    
    if [ "$ENV" == "dev" ]; then
        DB_HOST="127.0.0.1"
        DB_PORT="3307"
        DB_USER="rwroot"
        DB_PASSWORD="root"
        DB_NAME="dba"
        CONTAINER_NAME="dba-mysql-dev"
        ENV_NAME="Development"
    elif [ "$ENV" == "prod" ]; then
        DB_HOST="127.0.0.1"
        DB_PORT="5307"
        DB_USER="rwroot"
        DB_PASSWORD="${PROD_DB_PASSWORD:-root}"
        DB_NAME="dba"
        CONTAINER_NAME="dba-mysql-prod"
        ENV_NAME="Production"
    elif [ "$ENV" == "local" ]; then
        DB_HOST="127.0.0.1"
        DB_PORT="3307"
        DB_USER="rwroot"
        DB_PASSWORD="root"
        DB_NAME="dba"
        CONTAINER_NAME="dba-mysql-local"
        ENV_NAME="Local"
    else
        echo -e "${RED}Error: Invalid environment '$ENV'${NC}"
        echo "Usage: $0 [dev|prod|local] [backup|restore|migrate|status]"
        exit 1
    fi
}

# Logging function
log() {
    local LEVEL=$1
    shift
    local MESSAGE="$@"
    local TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    
    case $LEVEL in
        INFO)
            echo -e "${BLUE}[$TIMESTAMP]${NC} ${GREEN}[INFO]${NC} $MESSAGE"
            ;;
        WARN)
            echo -e "${BLUE}[$TIMESTAMP]${NC} ${YELLOW}[WARN]${NC} $MESSAGE"
            ;;
        ERROR)
            echo -e "${BLUE}[$TIMESTAMP]${NC} ${RED}[ERROR]${NC} $MESSAGE"
            ;;
        *)
            echo -e "${BLUE}[$TIMESTAMP]${NC} $MESSAGE"
            ;;
    esac
    
    # Also log to file
    mkdir -p "$LOG_DIR"
    echo "[$TIMESTAMP] [$LEVEL] $MESSAGE" >> "$LOG_DIR/migration_$TIMESTAMP.log"
}

# Create backup directory
init_directories() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    log "INFO" "Directories initialized"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log "ERROR" "Docker is not running. Please start Docker/Colima first."
        echo "  Try: colima start"
        exit 1
    fi
    log "INFO" "Docker is running ✓"
}

# Check database connectivity
check_database() {
    log "INFO" "Checking database connectivity..."
    
    local MAX_RETRIES=5
    local RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if docker run --rm --network host \
            mysql:8.0 \
            mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
            -e "SELECT 1;" "$DB_NAME" > /dev/null 2>&1; then
            log "INFO" "Database connection successful ✓"
            return 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log "WARN" "Connection attempt $RETRY_COUNT failed. Retrying..."
        sleep 2
    done
    
    log "ERROR" "Cannot connect to database after $MAX_RETRIES attempts"
    return 1
}

# Create database backup
create_backup() {
    local BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_$TIMESTAMP.sql"
    
    log "INFO" "Creating database backup..."
    log "INFO" "Backup file: $BACKUP_FILE"
    
    # Create backup using Docker
    if docker run --rm --network host \
        -v "$BACKUP_DIR":/backup \
        mysql:8.0 \
        mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --set-gtid-purged=OFF \
        "$DB_NAME" > "$BACKUP_FILE" 2>&1; then
        
        # Compress backup
        gzip "$BACKUP_FILE"
        log "INFO" "Backup created successfully ✓"
        log "INFO" "Compressed file: ${BACKUP_FILE}.gz"
        
        # Verify backup size
        local BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
        log "INFO" "Backup size: $BACKUP_SIZE"
        
        return 0
    else
        log "ERROR" "Backup failed!"
        return 1
    fi
}

# Verify backup integrity
verify_backup() {
    local BACKUP_FILE="$1"
    
    log "INFO" "Verifying backup integrity..."
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log "ERROR" "Backup file not found: $BACKUP_FILE"
        return 1
    fi
    
    # Test gzip integrity
    if gzip -t "$BACKUP_FILE" 2>/dev/null; then
        log "INFO" "Backup integrity verified ✓"
        return 0
    else
        log "ERROR" "Backup file is corrupted!"
        return 1
    fi
}

# Run database migration
run_migration() {
    local MIGRATION_FILE="$MIGRATIONS_DIR/add_welfare_member_indexes.sql"
    
    if [ ! -f "$MIGRATION_FILE" ]; then
        log "ERROR" "Migration file not found: $MIGRATION_FILE"
        return 1
    fi
    
    log "INFO" "Starting database migration..."
    log "INFO" "Migration file: $MIGRATION_FILE"
    
    # Extract only ALTER TABLE and ANALYZE statements (skip SHOW and SELECT)
    # This prevents output parsing issues
    local TEMP_SQL=$(mktemp)
    grep -E "^(ALTER|ANALYZE|CREATE|DROP|INSERT|UPDATE)" "$MIGRATION_FILE" > "$TEMP_SQL" || true
    
    # Run migration
    if docker run --rm --network host \
        -v "$MIGRATIONS_DIR":/migrations \
        mysql:8.0 \
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        "$DB_NAME" < "$TEMP_SQL" 2>&1; then
        
        log "INFO" "Migration completed successfully ✓"
        rm -f "$TEMP_SQL"
        return 0
    else
        local EXIT_CODE=$?
        log "ERROR" "Migration failed with exit code: $EXIT_CODE"
        rm -f "$TEMP_SQL"
        return 1
    fi
}

# Verify migration
verify_migration() {
    log "INFO" "Verifying migration..."
    
    # Check if indexes exist
    local INDEX_COUNT=$(docker run --rm --network host \
        mysql:8.0 \
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        -N -e "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE table_schema='$DB_NAME' AND table_name='members' AND index_name LIKE 'idx_%';" \
        2>/dev/null)
    
    if [ "$INDEX_COUNT" -ge 3 ]; then
        log "INFO" "Migration verified ✓ (Found $INDEX_COUNT indexes)"
        return 0
    else
        log "ERROR" "Migration verification failed (Found $INDEX_COUNT indexes, expected >= 3)"
        return 1
    fi
}

# Restore from backup
restore_backup() {
    local BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        # Try compressed version
        if [ -f "${BACKUP_FILE}.gz" ]; then
            BACKUP_FILE="${BACKUP_FILE}.gz"
        else
            log "ERROR" "Backup file not found: $BACKUP_FILE"
            return 1
        fi
    fi
    
    log "INFO" "Starting database restore..."
    log "INFO" "Restore file: $BACKUP_FILE"
    
    # Decompress if needed
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        local TEMP_SQL=$(mktemp)
        gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"
        BACKUP_FILE="$TEMP_SQL"
    fi
    
    # Restore database
    if docker run --rm --network host \
        -v "$(dirname "$BACKUP_FILE")":/backup \
        mysql:8.0 \
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        "$DB_NAME" < "$BACKUP_FILE" 2>&1; then
        
        log "INFO" "Restore completed successfully ✓"
        [ -f "$TEMP_SQL" ] && rm -f "$TEMP_SQL"
        return 0
    else
        log "ERROR" "Restore failed!"
        [ -f "$TEMP_SQL" ] && rm -f "$TEMP_SQL"
        return 1
    fi
}

# Show database status
show_status() {
    log "INFO" "Database Status for $ENV_NAME"
    echo "=========================================="
    
    # Database size
    local DB_SIZE=$(docker run --rm --network host \
        mysql:8.0 \
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        -N -e "SELECT SUM(data_length + index_length) / 1024 / 1024 AS 'size_mb' FROM information_schema.tables WHERE table_schema='$DB_NAME';" \
        2>/dev/null)
    
    echo "Database: $DB_NAME"
    echo "Size: ${DB_SIZE:-0} MB"
    
    # Table count
    local TABLE_COUNT=$(docker run --rm --network host \
        mysql:8.0 \
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';" \
        2>/dev/null)
    
    echo "Tables: ${TABLE_COUNT:-0}"
    
    # Index count
    local INDEX_COUNT=$(docker run --rm --network host \
        mysql:8.0 \
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        -N -e "SELECT COUNT(DISTINCT index_name) FROM information_schema.STATISTICS WHERE table_schema='$DB_NAME' AND index_name LIKE 'idx_%';" \
        2>/dev/null)
    
    echo "Custom Indexes: ${INDEX_COUNT:-0}"
    
    # Member count
    local MEMBER_COUNT=$(docker run --rm --network host \
        mysql:8.0 \
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        -N -e "SELECT COUNT(*) FROM $DB_NAME.members;" \
        2>/dev/null)
    
    echo "Members: ${MEMBER_COUNT:-0}"
    
    # Recent backups
    echo ""
    echo "Recent Backups:"
    ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -5 || echo "  No backups found"
    
    echo "=========================================="
}

# Main execution
main() {
    local ENV=${1:-local}
    local ACTION=${2:-migrate}
    
    echo "=========================================="
    echo "DBA ALLD Database Migration Tool"
    echo "Environment: $ENV"
    echo "Action: $ACTION"
    echo "=========================================="
    echo ""
    
    # Configure environment
    configure_environment "$ENV"
    
    # Initialize
    init_directories
    check_docker
    
    case $ACTION in
        backup)
            check_database
            create_backup
            ;;
        migrate)
            check_database
            log "WARN" "Creating pre-migration backup..."
            create_backup
            log "INFO" "Running migration..."
            run_migration
            log "INFO" "Verifying migration..."
            verify_migration
            log "INFO" "Migration completed successfully!"
            ;;
        restore)
            local BACKUP_FILE=${3:-$(ls -t "$BACKUP_DIR"/*.sql.gz | head -1)}
            if [ -z "$BACKUP_FILE" ]; then
                log "ERROR" "No backup file found"
                exit 1
            fi
            verify_backup "$BACKUP_FILE"
            restore_backup "$BACKUP_FILE"
            ;;
        status)
            show_status
            ;;
        rollback)
            local BACKUP_FILE=${3:-$(ls -t "$BACKUP_DIR"/*.sql.gz | head -1)}
            if [ -z "$BACKUP_FILE" ]; then
                log "ERROR" "No backup file found for rollback"
                exit 1
            fi
            log "WARN" "Rolling back to backup..."
            verify_backup "$BACKUP_FILE"
            restore_backup "$BACKUP_FILE"
            ;;
        *)
            echo "Usage: $0 [dev|prod|local] [backup|restore|migrate|status|rollback] [backup_file]"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
