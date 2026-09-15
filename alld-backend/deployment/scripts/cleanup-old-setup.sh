#!/bin/bash
# ================================================================
# DBA ALLD - Cleanup Old Containers and Ports
# Stops and removes containers using old ports
# ================================================================

set -e

echo "=========================================="
echo "DBA ALLD - Cleanup Old Setup"
echo "=========================================="
echo ""

# Stop and remove old containers
echo "Stopping old containers..."
docker stop dba-mysql-local 2>/dev/null || true
docker stop jenkins-master 2>/dev/null || true
docker stop dba-phpmyadmin 2>/dev/null || true

echo "Removing old containers..."
docker rm dba-mysql-local 2>/dev/null || true
docker rm jenkins-master 2>/dev/null || true
docker rm dba-phpmyadmin 2>/dev/null || true

# Check if ports are free
echo ""
echo "Checking port availability..."

# Check port 3307 (old MySQL port)
if lsof -i :3307 > /dev/null 2>&1; then
    echo "⚠️  Port 3307 is still in use:"
    lsof -i :3307
    echo ""
    echo "To kill the process: kill -9 \$(lsof -ti :3307)"
else
    echo "✓ Port 3307 is free"
fi

# Check port 4306 (new MySQL port)
if lsof -i :4306 > /dev/null 2>&1; then
    echo "⚠️  Port 4306 is in use:"
    lsof -i :4306
else
    echo "✓ Port 4306 is free"
fi

# Check port 4082 (new phpMyAdmin port)
if lsof -i :4082 > /dev/null 2>&1; then
    echo "⚠️  Port 4082 is in use:"
    lsof -i :4082
else
    echo "✓ Port 4082 is free"
fi

echo ""
echo "=========================================="
echo "Cleanup completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run: ./setup-local-complete.sh"
echo "2. Or manually: cd ../local-setup && docker-compose up -d"
echo ""
