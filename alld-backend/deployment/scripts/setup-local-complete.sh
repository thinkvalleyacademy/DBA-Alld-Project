#!/bin/bash
# ================================================================
# DBA ALLD - Complete Local Setup Script
# Sets up Jenkins, Docker, MySQL, and runs migration pipeline
# ================================================================
# Usage: ./setup-local-complete.sh
# ================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SETUP_DIR="$PROJECT_ROOT/local-setup"
JENKINS_HOME="$SETUP_DIR/jenkins"
DOCKER_COMPOSE_FILE="$SETUP_DIR/docker-compose.yml"

log() {
    local LEVEL=$1
    shift
    echo -e "${BLUE}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} ${GREEN}[$LEVEL]${NC} $@"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $@"
}

error() {
    echo -e "${RED}[ERROR]${NC} $@"
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        echo "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    # Check Colima (for Mac)
    if command -v colima &> /dev/null; then
        if ! colima status &> /dev/null; then
            log "INFO" "Starting Colima..."
            colima start --cpu 4 --memory 8 --disk 100
        fi
    fi
    
    # Verify Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running"
        echo "Start Docker Desktop or run: colima start"
        exit 1
    fi
    log "INFO" "Docker is running ✓"
    
    # Check Java (for Jenkins CLI)
    if ! command -v java &> /dev/null; then
        warn "Java not found. Jenkins will run in Docker only."
    fi
    
    # Check available disk space
    local AVAILABLE=$(df -P "$PROJECT_ROOT" | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE" -lt 10485760 ]; then
        error "Insufficient disk space (need at least 10GB)"
        exit 1
    fi
    log "INFO" "Disk space OK ✓"
}

# Create setup directory
create_setup_directory() {
    log "INFO" "Creating setup directory..."
    mkdir -p "$JENKINS_HOME"
    mkdir -p "$SETUP_DIR/mysql"
    mkdir -p "$SETUP_DIR/jenkins-plugins"
}

# Create Docker Compose file
create_docker_compose() {
    log "INFO" "Creating Docker Compose configuration..."
    
    cat > "$DOCKER_COMPOSE_FILE" << 'EOF'
version: '3.8'

services:
  # Jenkins Master
  jenkins:
    image: jenkins/jenkins:lts
    container_name: jenkins-master
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - ./jenkins:/var/jenkins_home
      - ./jenkins-plugins:/var/jenkins_plugins
      - /var/run/docker.sock:/var/run/docker.sock
      - ../:/workspace:cached
    environment:
      - JAVA_OPTS=-Duser.timezone=Asia/Kolkata
      - JENKINS_OPTS=--prefix=/jenkins
    privileged: true
    networks:
      - dba-network
    restart: unless-stopped

  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: dba-mysql-local
    ports:
      - "4306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: dba
      MYSQL_USER: rwroot
      MYSQL_PASSWORD: root
    volumes:
      - ./mysql/data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d
    command: >
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
    networks:
      - dba-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-proot"]
      interval: 10s
      timeout: 5s
      retries: 5

  # phpMyAdmin (Optional - for DB visualization)
  phpmyadmin:
    image: phpmyadmin:latest
    container_name: dba-phpmyadmin
    ports:
      - "4082:80"
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_USER: rwroot
      PMA_PASSWORD: root
    depends_on:
      - mysql
    networks:
      - dba-network
    restart: unless-stopped

networks:
  dba-network:
    driver: bridge
EOF

    log "INFO" "Docker Compose file created ✓"
}

# Create MySQL initialization script
create_mysql_init() {
    log "INFO" "Creating MySQL initialization script..."
    
    mkdir -p "$SETUP_DIR/mysql/init"
    
    cat > "$SETUP_DIR/mysql/init/01-create-schema.sql" << 'EOF'
-- DBA ALLD Database Schema
USE dba;

-- Create members table if not exists
CREATE TABLE IF NOT EXISTS members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id VARCHAR(20) NOT NULL,
    member_type VARCHAR(50),
    name VARCHAR(60) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    relation VARCHAR(20) NOT NULL,
    guardian_name VARCHAR(60) NOT NULL,
    dob DATE,
    blood_group VARCHAR(20),
    registration_type VARCHAR(100) NOT NULL,
    registration_no VARCHAR(64),
    en_no VARCHAR(64),
    address VARCHAR(200) NOT NULL,
    city VARCHAR(60) NOT NULL,
    zip VARCHAR(10) NOT NULL,
    state VARCHAR(60) NOT NULL,
    ks_address VARCHAR(200) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(60),
    nominee_name VARCHAR(60) NOT NULL,
    nominee_mobile VARCHAR(20) NOT NULL,
    membership_date DATE,
    expiry_date DATE,
    bc_of_up_type VARCHAR(20) NOT NULL,
    bc_of_up_photo VARCHAR(200),
    voter VARCHAR(20) NOT NULL,
    affidavite VARCHAR(200),
    photo VARCHAR(200),
    qrcode VARCHAR(200),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_date DATETIME,
    created_by VARCHAR(60),
    updated_date DATETIME,
    updated_by VARCHAR(60),
    gm_lm_member_type INT NOT NULL DEFAULT 1,
    is_wm BOOLEAN NOT NULL DEFAULT FALSE,
    INDEX idx_member_id (member_id),
    INDEX idx_mobile (mobile),
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_is_wm (is_wm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO members (
    member_id, member_type, name, gender, relation, guardian_name,
    dob, blood_group, registration_type, registration_no, en_no,
    address, city, zip, state, ks_address, mobile, email,
    nominee_name, nominee_mobile, membership_date, expiry_date,
    bc_of_up_type, voter, affidavite, photo, qrcode, status,
    created_date, created_by, gm_lm_member_type, is_wm
) VALUES
('POR00000001', 'General Member', 'Rajesh Kumar', 'Male', 'S/O', 'Mohan Lal',
 '1980-05-15', 'B+', 'C.O.P No.', '12345', 'EN001',
 '123 Civil Lines', 'Allahabad', '211001', 'UP', '456 Civil Lines', '9876543210', 'rajesh@example.com',
 'Sunita Kumar', '9876543211', '2020-01-01', '2026-03-31',
 'Agricultural', 'Yes', 'affidavit_001.pdf', 'photos/001.jpg', 'qrcode/001.png', 'ACTIVE',
 NOW(), 'admin', 1, FALSE),
('POR00000002', 'Life Member', 'Amit Sharma', 'Male', 'S/O', 'Rakesh Sharma',
 '1975-08-20', 'O+', 'C.O.P No.', '12346', 'EN002',
 '456 George Street', 'Allahabad', '211002', 'UP', '789 George Street', '9876543212', 'amit@example.com',
 'Priya Sharma', '9876543213', '2019-06-15', NULL,
 'Business', 'Yes', 'affidavit_002.pdf', 'photos/002.jpg', 'qrcode/002.png', 'ACTIVE',
 NOW(), 'admin', 2, FALSE),
('POR00000003', 'Welfare Member', 'Suresh Yadav', 'Male', 'S/O', 'Ram Yadav',
 '1985-03-10', 'A+', 'C.O.P No.', '12347', 'EN003',
 '789 MG Road', 'Allahabad', '211003', 'UP', '321 MG Road', '9876543214', 'suresh@example.com',
 'Meera Yadav', '9876543215', '2021-02-20', NULL,
 'Agricultural', 'No', '', 'photos/003.jpg', 'qrcode/003.png', 'ACTIVE',
 NOW(), 'admin', 1, TRUE);

SELECT 'Database initialized successfully!' AS status;
EOF

    log "INFO" "MySQL initialization script created ✓"
}

# Start Docker containers
start_containers() {
    log "INFO" "Starting Docker containers..."
    
    cd "$SETUP_DIR"
    docker-compose up -d
    
    log "INFO" "Waiting for containers to start..."
    sleep 30
    
    # Check container status
    docker-compose ps
    
    # Wait for MySQL to be ready
    log "INFO" "Waiting for MySQL to be ready..."
    local MAX_RETRIES=30
    local RETRY=0
    
    while [ $RETRY -lt $MAX_RETRIES ]; do
        if docker exec dba-mysql-local mysqladmin ping -h localhost -u root -proot &> /dev/null; then
            log "INFO" "MySQL is ready ✓"
            break
        fi
        RETRY=$((RETRY + 1))
        sleep 2
    done
    
    if [ $RETRY -eq $MAX_RETRIES ]; then
        error "MySQL failed to start"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
}

# Install Jenkins plugins
install_jenkins_plugins() {
    log "INFO" "Waiting for Jenkins to start..."
    sleep 60
    
    log "INFO" "Installing Jenkins plugins..."
    
    # List of required plugins
    local PLUGINS=(
        "docker-plugin"
        "docker-workflow"
        "docker-commons"
        "pipeline"
        "pipeline-stage-view"
        "git"
        "github"
        "credentials"
        "plain-credentials"
        "ssh-credentials"
        "config-file-provider"
        "blueocean"
    )
    
    # Install plugins using Docker
    docker exec jenkins-master /bin/bash -c "
        jenkins-plugin-cli --plugins ${PLUGINS[*]} --war /usr/share/jenkins/jenkins.war
    " || warn "Plugin installation via CLI failed, will install via UI"
    
    log "INFO" "Jenkins plugins installation initiated ✓"
}

# Configure Jenkins credentials
configure_jenkins() {
    log "INFO" "Jenkins will be available at: http://localhost:8080/jenkins"
    log "INFO" "Initial admin password:"
    
    # Get Jenkins admin password
    docker exec jenkins-master cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null || \
        echo "Check: $JENKINS_HOME/secrets/initialAdminPassword"
    
    echo ""
    log "INFO" "Jenkins Setup Instructions:"
    echo "1. Open: http://localhost:8080/jenkins"
    echo "2. Enter admin password from above"
    echo "3. Install suggested plugins"
    echo "4. Create admin user"
    echo "5. Save and continue"
}

# Verify setup
verify_setup() {
    log "INFO" "Verifying setup..."
    
    echo ""
    echo "=========================================="
    echo "Service Status:"
    echo "=========================================="
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    echo ""
    echo "=========================================="
    echo "Access URLs:"
    echo "=========================================="
    echo "Jenkins:      http://localhost:8080/jenkins"
    echo "phpMyAdmin:   http://localhost:4082"
    echo ""
    echo "Database Connection:"
    echo "  Host: localhost"
    echo "  Port: 4306"
    echo "  Username: rwroot"
    echo "  Password: root"
    echo "  Database: dba"
    echo "=========================================="
}

# Main function
main() {
    echo "=========================================="
    echo "DBA ALLD - Complete Local Setup"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    create_setup_directory
    create_docker_compose
    create_mysql_init
    start_containers
    install_jenkins_plugins
    configure_jenkins
    verify_setup
    
    echo ""
    log "INFO" "Setup completed successfully! ✓"
    echo ""
    echo "Next Steps:"
    echo "1. Complete Jenkins setup at: http://localhost:8080/jenkins"
    echo "2. Create Jenkins pipeline jobs (see docs/JENKINS-MIGRATION-GUIDE.md)"
    echo "3. Run database migration pipeline"
    echo ""
    echo "To stop all services:"
    echo "  cd $SETUP_DIR && docker-compose down"
    echo ""
    echo "To start services again:"
    echo "  cd $SETUP_DIR && docker-compose up -d"
}

main "$@"
