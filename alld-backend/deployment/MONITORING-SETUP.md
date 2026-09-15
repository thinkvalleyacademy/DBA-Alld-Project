# DBA ALLD Monitoring Setup Guide

Separate monitoring for DEV and PROD environments using Jenkins pipelines.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    DEV ENVIRONMENT                           │
├──────────────────────────────────────────────────────────────┤
│  Jenkins: monitoring-deploy-dev                              │
│  ├── Prometheus DEV  (Port 4090)                             │
│  └── Grafana DEV     (Port 4001)                             │
│                                                              │
│  Backend DEV (Port 8090 - metrics endpoint)                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    PROD ENVIRONMENT                          │
├──────────────────────────────────────────────────────────────┤
│  Jenkins: monitoring-deploy-prod                             │
│  ├── Prometheus PROD (Port 5090)                             │
│  └── Grafana PROD    (Port 5001)                             │
│                                                              │
│  Backend PROD (Port 8290 - metrics endpoint)                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 Jenkins Pipelines

### Separate Monitoring Pipelines

| Pipeline | File | Purpose |
|----------|------|---------|
| **monitoring-deploy-dev** | `Jenkinsfile.monitoring.dev` | Deploy DEV monitoring |
| **monitoring-deploy-prod** | `Jenkinsfile.monitoring.prod` | Deploy PROD monitoring |
| **backend-deploy-dev** | `Jenkinsfile.backend.dev.enhanced` | Deploy DEV backend only |
| **backend-deploy-prod** | `Jenkinsfile.backend.prod` | Deploy PROD backend only |

**Key Principle:** Monitoring is **completely separate** from backend deployments.

---

## 🚀 Quick Start

### DEV Monitoring Setup

**Step 1: Create Jenkins Job**

1. Go to Jenkins → New Item
2. Name: `monitoring-deploy-dev`
3. Type: Pipeline
4. Pipeline Script Path: `deployment/Jenkinsfile.monitoring.dev`

**Step 2: Deploy Monitoring**

1. Go to Jenkins → `monitoring-deploy-dev`
2. Click **"Build with Parameters"**
3. Leave parameters unchecked (first time)
4. Click **"Build"**

**Step 3: Access**

- **Grafana DEV:** http://100.101.103.63:4001
- **Prometheus DEV:** http://100.101.103.63:4090

**Login:**
- Username: `admin`
- Password: `admin123`

---

### PROD Monitoring Setup

**Step 1: Create Jenkins Job**

1. Go to Jenkins → New Item
2. Name: `monitoring-deploy-prod`
3. Type: Pipeline
4. Pipeline Script Path: `deployment/Jenkinsfile.monitoring.prod`

**Step 2: Deploy Monitoring**

1. Go to Jenkins → `monitoring-deploy-prod`
2. Click **"Build with Parameters"**
3. Leave parameters unchecked (first time)
4. Click **"Build"**

**Step 3: Access**

- **Grafana PROD:** http://100.101.103.63:5001
- **Prometheus PROD:** http://100.101.103.63:5090

**Login:**
- Username: `admin`
- Password: `admin123`

---

## 📁 File Structure

```
deployment/
├── docker-compose.monitoring.dev.yml    # DEV monitoring stack
├── docker-compose.monitoring.prod.yml   # PROD monitoring stack
├── Jenkinsfile.monitoring.dev           # DEV monitoring pipeline
├── Jenkinsfile.monitoring.prod          # PROD monitoring pipeline
└── monitoring/
    ├── dev/                             # DEV monitoring configs
    │   ├── prometheus/
    │   │   └── prometheus.yml
    │   └── grafana/
    │       ├── provisioning/
    │       │   ├── datasources/
    │       │   │   └── datasource.yml
    │       │   └── dashboards/
    │       │       └── dashboard.yml
    │       ├── dashboards/
    │       │   └── spring-boot-dashboard.json
    │       └── grafana-data/ (created on server)
    │
    └── prod/                            # PROD monitoring configs
        ├── prometheus/
        │   └── prometheus.yml
        └── grafana/
            ├── provisioning/
            │   ├── datasources/
            │   │   └── datasource.yml
            │   └── dashboards/
            │       └── dashboard.yml
            ├── dashboards/
            │   └── spring-boot-dashboard.json
            └── grafana-data/ (created on server)
```

---

## 🔧 Configuration

### DEV Environment

| Component | Port | Container Name |
|-----------|------|----------------|
| Grafana | 4001 | dba-dev-grafana |
| Prometheus | 4090 | dba-dev-prometheus |
| Backend Metrics | 8090 | dba-dev-backend |

**Prometheus Scrape Config:**
```yaml
job_name: 'dba-backend-dev'
targets: ['host.docker.internal:8090']
```

---

### PROD Environment

| Component | Port | Container Name |
|-----------|------|----------------|
| Grafana | 5001 | dba-prod-grafana |
| Prometheus | 5090 | dba-prod-prometheus |
| Backend Metrics | 8290 | dba-prod-backend |

**Prometheus Scrape Config:**
```yaml
job_name: 'dba-backend-prod'
targets: ['host.docker.internal:8290']
```

---

## 🎯 Jenkins Parameters

### monitoring-deploy-dev / monitoring-deploy-prod

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `RECREATE_MONITORING` | boolean | false | Force recreate all containers |
| `RESET_GRAFANA_PASSWORD` | boolean | false | Reset Grafana to default password |

---

## 📊 Dashboards

Pre-configured Spring Boot dashboard includes:

- ✅ Backend Status (UP/DOWN)
- ✅ Application Uptime
- ✅ JVM Memory Usage
- ✅ Request Rate (RPS)
- ✅ Average Response Time
- ✅ Tomcat Thread Pool Metrics

**Dashboard Location:** `deployment/monitoring/{dev|prod}/grafana/dashboards/spring-boot-dashboard.json`

---

## 🔐 Security

### Change Default Password

**Immediately after first login:**

1. Login to Grafana
2. Go to: Configuration (gear icon) → Users
3. Click on "admin"
4. Change password

### Or Reset via Jenkins

1. Go to Jenkins → `monitoring-deploy-{dev|prod}`
2. Click "Build with Parameters"
3. Check ✅ `RESET_GRAFANA_PASSWORD`
4. Click "Build"
5. Login with: `admin` / `admin123`
6. **Change password immediately!**

---

## 🛠️ Management Commands

### DEV Environment

```bash
cd /home/dbadev01/app-deployment-dev

# Check status
docker compose -f docker-compose.monitoring.dev.yml ps

# View logs
docker compose -f docker-compose.monitoring.dev.yml logs -f

# Restart
docker compose -f docker-compose.monitoring.dev.yml restart

# Stop
docker compose -f docker-compose.monitoring.dev.yml down
```

### PROD Environment

```bash
cd /home/dbadev01/app-deployment-prod

# Check status
docker compose -f docker-compose.monitoring.prod.yml ps

# View logs
docker compose -f docker-compose.monitoring.prod.yml logs -f

# Restart
docker compose -f docker-compose.monitoring.prod.yml restart

# Stop
docker compose -f docker-compose.monitoring.prod.yml down
```

---

## ✅ Backend Configuration

### DEV Backend (application-dev.properties)

```properties
# Metrics endpoint
management.server.port=8090
management.server.address=0.0.0.0
management.endpoints.web.exposure.include=health,info,prometheus,metrics
```

### PROD Backend (application-prod.properties)

```properties
# Metrics endpoint
management.server.port=8290
management.server.address=0.0.0.0
management.endpoints.web.exposure.include=health,info,prometheus,metrics
```

---

## 🔍 Troubleshooting

### Prometheus Can't Scrape Backend

**Check backend metrics endpoint:**
```bash
# DEV
curl http://100.101.103.63:8090/actuator/prometheus

# PROD
curl http://100.101.103.63:8290/actuator/prometheus
```

**Check Prometheus targets:**
- DEV: http://100.101.103.63:4090/targets
- PROD: http://100.101.103.63:5090/targets

### Grafana Shows No Data

1. **Check datasource:**
   - Grafana → Configuration → Data Sources
   - Click "Save & Test"

2. **Verify Prometheus is scraping:**
   - Prometheus → Status → Targets
   - Should show "UP"

3. **Check backend is running:**
   ```bash
   docker ps | grep backend
   ```

### Jenkins Build Fails

**Check console output for error details**

Common issues:
- Network already exists → Use `RECREATE_MONITORING=true`
- Port already in use → Check old containers: `docker ps | grep grafana`
- Password not working → Use `RESET_GRAFANA_PASSWORD=true`

---

## 📈 Monitoring Best Practices

### ✅ DO:
- Keep DEV and PROD monitoring separate
- Test dashboards in DEV before PROD
- Change default passwords immediately
- Monitor disk usage on Prometheus
- Backup Grafana data regularly

### ❌ DON'T:
- Share monitoring between environments
- Use default passwords in production
- Expose Prometheus publicly without auth
- Ignore disk space warnings

---

## 📊 Access Summary

| Environment | Grafana | Prometheus | Backend Metrics |
|-------------|---------|------------|-----------------|
| **DEV** | http://100.101.103.63:4001 | http://100.101.103.63:4090 | http://100.101.103.63:8090 |
| **PROD** | http://100.101.103.63:5001 | http://100.101.103.63:5091 | http://100.101.103.63:8090 |

---

## 🚀 Deployment Workflow

### First-Time Setup

```
1. Create Jenkins jobs for monitoring
   ├── monitoring-deploy-dev
   └── monitoring-deploy-prod

2. Deploy DEV monitoring
   └── Run Jenkins: monitoring-deploy-dev

3. Deploy PROD monitoring
   └── Run Jenkins: monitoring-deploy-prod

4. Configure backend metrics ports
   ├── DEV: 8090 (already configured)
   └── PROD: 8290 (add to application-prod.properties)

5. Access Grafana dashboards
   ├── DEV: http://100.101.103.63:4001
   └── PROD: http://100.101.103.63:5001
```

### Ongoing Updates

```
1. Update monitoring config in git
2. Commit and push
3. Run appropriate Jenkins job
   └── monitoring-deploy-{dev|prod}
4. Monitoring updates automatically
```

---

**Last Updated:** 2026-03-21  
**Maintained By:** DevOps Team
