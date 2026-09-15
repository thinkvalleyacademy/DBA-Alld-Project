#!/bin/bash
set -eux

# Monitoring deployment script for DBA ALLD
DEPLOY_ROOT="/home/dbadev01/app-deployment-dev"
MONITORING_DIR="$DEPLOY_ROOT/monitoring"
COMPOSE_FILE="$DEPLOY_ROOT/docker-compose.monitoring.dev.yml"

echo "========================================="
echo "DBA ALLD Monitoring Deployment"
echo "========================================="

# Create monitoring directory
mkdir -p "$MONITORING_DIR"

# Copy monitoring configs
rsync -a --delete ./monitoring/ "$MONITORING_DIR/"

# Copy docker-compose file
cp ./deployment/docker-compose.monitoring.dev.yml "$COMPOSE_FILE"

# Start monitoring stack
cd "$DEPLOY_ROOT"
docker compose -f "$COMPOSE_FILE" up -d

# Show status
docker compose -f "$COMPOSE_FILE" ps

echo "========================================="
echo "✅ Monitoring deployed successfully!"
echo "========================================="
echo ""
echo "📊 Prometheus: http://100.101.103.63:4090"
echo "📈 Grafana: http://100.101.103.63:4001"
echo ""
echo "Grafana Login:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change the default password after first login!"
echo "========================================="
