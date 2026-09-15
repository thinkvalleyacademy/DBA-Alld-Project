# DBA ALLD Backend - Release Notes & Change Log

**Project:** DBA ALLD (Automated Legal Land Documentation)
**Repository:** alld-backend
**Last Updated:** 2026-04-12
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

- [Latest Release (2026-04-12)](#latest-release-2026-04-12)
- [Previous Release (2026-03-25)](#previous-release-2026-03-25)
- [Performance Optimizations](#performance-optimizations)
- [Bug Fixes](#bug-fixes)
- [Configuration Changes](#configuration-changes)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Latest Release (2026-04-12)

### Summary

Feature release adding **voter list search functionality** for both General Member and Life Member voter lists. Users can now search across the entire voter database (not just the current page) using multiple search fields.

### New Features

#### 1. Voter List Search (New)

**What Changed:**
- Added search functionality to both GM and LM voter list pages
- Search works across the **entire voter list** (server-side pagination)
- Search is case-insensitive and supports multiple fields

**Search Fields:**
- Member Name
- Guardian Name
- Member ID
- C.O.P No
- Enrollment No
- Mobile Number

**API Endpoints Added:**
| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/voter/gm/search` | Search General Member voters |
| `GET /api/v1/voter/lm/search` | Search Life Member voters |
| `GET /api/v1/voter/lm/search/by-month-year` | Search LM voters with month/year filter |

**Parameters:**
```
query: String (required) - Search term
year: int (for GM/LM with date filter)
month: int (for GM/LM with date filter)
page: int (default: 0)
size: int (default: 20)
```

**Frontend Changes:**
- Added search input field with purple/indigo gradient design
- Search button with Enter key support
- Reset button to clear search and return to full list
- Visual feedback showing active search query
- Search result count display

**Files Modified:**

*Backend:*
- `src/main/java/com/dba/alld/repository/MembersRepository.java`
- `src/main/java/com/dba/alld/service/VoterService.java`
- `src/main/java/com/dba/alld/service/impl/VoterServiceImpl.java`
- `src/main/java/com/dba/alld/controller/VoterController.java`

*Frontend:*
- `src/components/apiService.js`
- `src/components/VoterList.jsx`
- `src/features/users/components/GMVoterList.jsx`
- `src/features/users/components/LMVoterList.jsx`

**Example Usage:**
```bash
# Search GM voters
GET /dba-alld/api/v1/voter/gm/search?year=2026&month=4&query=John&page=0&size=20

# Search LM voters
GET /dba-alld/api/v1/voter/lm/search?query=Smith&page=0&size=20
```

**Response Format:**
```json
{
  "status": 200,
  "message": "GM Voter Search Results for 'John' as of 2026-04-30",
  "data": {
    "members": [...],
    "totalMembers": 15,
    "totalPages": 1,
    "currentPage": 0,
    "pageSize": 20
  }
}
```

**Benefits:**
- ✅ Quick voter lookup without browsing through pages
- ✅ Search across all voters (not just current page)
- ✅ Works for both GM and LM voter lists
- ✅ Supports partial matching
- ✅ Case-insensitive search
- ✅ Improves user efficiency

---

## 🎯 Previous Release (2026-03-25)

### Summary

Major performance optimization release focusing on application startup time, security improvements, and rootless Docker compatibility.

### Key Achievements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Startup Time** | 590 seconds | 51 seconds | **92% faster** ⚡ |
| **Security** | Root user | Non-root appuser | ✅ Secure |
| **Log Permissions** | Permission errors | Fixed | ✅ Rootless-compatible |
| **Auto-Build** | Manual intervention | Automatic | ✅ Zero-touch |

---

## 🚀 Performance Optimizations

### 1. Hibernate Schema Validation (High Impact)

**Problem:** `ddl-auto=update` was validating/updating schema on every startup (4.5 minutes)

**Solution:** Changed to `ddl-auto=validate`

**Files Modified:**
- `src/main/resources/application-prod.properties`
- `src/main/resources/application-dev.properties`

**Impact:** Saves 3-5 minutes on startup

```properties
# Before
spring.jpa.hibernate.ddl-auto=update

# After
spring.jpa.hibernate.ddl-auto=validate
```

---

### 2. SQL Logging Disabled (Medium Impact)

**Problem:** SQL logging was enabled, causing I/O overhead

**Solution:** Disabled SQL logging in production

**Files Modified:**
- `src/main/resources/application-prod.properties`
- `src/main/resources/application-dev.properties`

**Impact:** Saves 30-60 seconds

```properties
# Before
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# After
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
```

---

### 3. JVM Optimizations (Medium Impact)

**Problem:** Default JVM settings not optimized for containers

**Solution:** Added JVM flags for container-aware memory management and faster GC

**Files Modified:**
- `alld-backend/Dockerfile`

**Impact:** Saves 1-2 minutes

```dockerfile
# Before
CMD ["java","-jar","app.jar"]

# After
ENTRYPOINT ["sh", "-c", "java \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+ParallelRefProcEnabled \
  -Djava.security.egd=file:/dev/./urandom \
  -jar app.jar"
]
```

---

### 4. Security: Non-Root User (Security)

**Problem:** Container running as root (security risk)

**Solution:** Created non-root user `appuser`

**Files Modified:**
- `alld-backend/Dockerfile`

```dockerfile
# Create non-root user for security
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
RUN chown -R appuser:appgroup /app
USER appuser
```

---

### 5. Log Directory Fix (Bug Fix)

**Problem:** `/var/log/dba-alld` required root permissions, causing errors

**Solution:** Changed to `/app/logs` (owned by appuser)

**Files Modified:**
- `alld-backend/Dockerfile`
- `src/main/resources/application-prod.properties`
- `src/main/resources/application-dev.properties`
- `deployment/docker-compose.backend.dev.yml`
- `deployment/docker-compose.backend.prod.yml`

**Impact:** Eliminates permission errors, works with rootless Docker

```properties
# Before
app.log.dir=${APP_LOG_DIR:/var/log/dba-alld}

# After
app.log.dir=${APP_LOG_DIR:/app/logs}
```

---

## 🤖 Jenkins Pipeline Improvements

### Auto-Build Stage (Reliability)

**Problem:** Deployment failed when Docker image missing (error: "No such image")

**Solution:** Added "Ensure Image Available" stage that auto-builds missing images

**Files Modified:**
- `deployment/Jenkinsfile.backend.dev`
- `deployment/Jenkinsfile.backend.prod`

**Impact:** Zero manual intervention needed

```groovy
stage('Ensure Image Available') {
  steps {
    // Check if image exists
    // Auto-build if missing
    // Tag with both build number and env tag (dev/prod)
  }
}
```

---

### Removed --pull never Flag (Reliability)

**Problem:** `--pull never` caused failures when image missing

**Solution:** Removed flag, rely on "Ensure Image Available" stage

**Files Modified:**
- `deployment/Jenkinsfile.backend.dev`
- `deployment/Jenkinsfile.backend.prod`

---

### Health Check Timeout (Operational)

**Problem:** 20s timeout too short for actual startup time

**Solution:** Increased to 60s

**Files Modified:**
- `deployment/docker-compose.backend.dev.yml`
- `deployment/docker-compose.backend.prod.yml`

```yaml
healthcheck:
  start_period: 60s  # Increased from 20s
```

---

## 📊 Performance Results

### Startup Time Breakdown

| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| Repository Scan | 4,080 ms | 311 ms | 93% |
| Web Context Init | 162,801 ms | 9,462 ms | 94% |
| Hibernate Init | ~240,000 ms | ~11,000 ms | 95% |
| DB Connection | ~2,000 ms | ~1,600 ms | 20% |
| **TOTAL** | **590 seconds** | **51 seconds** | **92%** |

### Annual Impact

**Assuming 10 deployments/day:**
- Before: 1,633 hours/year wasted on startup
- After: 141 hours/year
- **Saved: 1,492 hours/year = 62 days!** 🎉

---

## 🔧 Configuration Changes

### application-prod.properties

```properties
# Schema validation (was: update)
spring.jpa.hibernate.ddl-auto=validate

# SQL logging disabled (was: true)
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# Log directory (was: /var/log/dba-alld)
app.log.dir=${APP_LOG_DIR:/app/logs}
```

### application-dev.properties

```properties
# Schema validation (was: update)
spring.jpa.hibernate.ddl-auto=validate

# SQL logging disabled (was: true)
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# Log directory (was: ./backend-logs)
app.log.dir=${APP_LOG_DIR:/app/logs}
```

### Dockerfile

```dockerfile
# Security: Non-root user
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
RUN chown -R appuser:appgroup /app

# Log directory (no root needed)
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app/logs

# JVM optimizations
ENTRYPOINT ["sh", "-c", "java \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+ParallelRefProcEnabled \
  -Djava.security.egd=file:/dev/./urandom \
  -jar app.jar"
]
```

### docker-compose.backend.dev.yml

```yaml
volumes:
  - ./backend-storage:/home/dbadev01/app-deployment-dev/backend
  - ./backend-logs:/app/logs  # Changed from /var/log/dba-alld

healthcheck:
  start_period: 60s  # Increased from 20s
```

### docker-compose.backend.prod.yml

```yaml
volumes:
  - ./backend-storage:/opt/dbaalld01_project/deploy-dba_alld_project/backend
  - /home/dbadev01/app-deployment-prod/backend-logs:/app/logs  # Changed from /var/log/dba-alld

healthcheck:
  start_period: 60s  # Increased from 20s
```

---

## 🚀 Deployment Guide

### Prerequisites

- Docker and Docker Compose installed
- Jenkins access (for automated deployment)
- SSH access to deployment server (for manual deployment)

### Automated Deployment (Jenkins)

#### Dev Environment

1. Go to Jenkins → `backend-deploy-dev` job
2. Click "Build with Parameters"
3. Set parameters:
   ```
   RUN_UNIT_TESTS: false (or true)
   FORCE_IMAGE_BUILD: false
   RECREATE_DB: false
   ```
4. Click "Build"
5. Monitor console output

#### Prod Environment

1. Go to Jenkins → `backend-deploy-prod` job
2. Click "Build with Parameters"
3. Set parameters:
   ```
   BACKEND_HOST: api.alld.example.com
   TRAEFIK_TLS: true
   FORCE_IMAGE_BUILD: false
   RECREATE_DB: false
   ```
4. Click "Build"
5. Monitor console output

### Manual Deployment

#### Dev Environment

```bash
# 1. Build Docker image
cd alld-backend
docker build -t dba/backend:dev -f Dockerfile .

# 2. Deploy
cd deployment
docker-compose -f docker-compose.backend.dev.yml up -d

# 3. Monitor
docker logs -f dba-dev-backend

# 4. Verify startup time
docker logs dba-dev-backend 2>&1 | grep "Started AlldApplication"
```

#### Prod Environment

```bash
# 1. Build Docker image
cd alld-backend
docker build -t dba/backend:prod -f Dockerfile .

# 2. Deploy
cd deployment
docker-compose -f docker-compose.backend.prod.yml up -d

# 3. Monitor
docker logs -f dba-prod-backend

# 4. Verify
docker logs dba-prod-backend 2>&1 | grep "Started AlldApplication"
```

---

## 🔍 Verification Commands

### Check Startup Time

```bash
docker logs <container-name> 2>&1 | grep "Started AlldApplication"
# Expected: Started AlldApplication in 45-55 seconds
```

### Check Health

```bash
# Dev
curl http://localhost:5081/dba-alld/actuator/health

# Prod
curl -k https://localhost:5281/dba-alld/actuator/health
```

### Check Logs

```bash
# Via Docker
docker logs -f <container-name>

# Via host file (dev)
tail -f /home/dbadev01/app-deployment-dev/backend-logs/application.log

# Via host file (prod)
tail -f /home/dbadev01/app-deployment-prod/backend-logs/application.log
```

### Check Container Status

```bash
docker ps | grep dba-dev-backend
docker ps | grep dba-prod-backend
```

---

## 🛠️ Troubleshooting

### Issue: Permission Denied on Logs

**Error:**
```
/var/log/dba-alld/application.log (Permission denied)
```

**Solution:** Already fixed in this release. Rebuild Docker image:
```bash
docker build -t dba/backend:dev -f Dockerfile .
```

---

### Issue: "No such image" Error

**Error:**
```
Error response from daemon: No such image: dba/backend:71
```

**Solution:** Already fixed in Jenkinsfile. "Ensure Image Available" stage will auto-build.

**Manual fix:**
```bash
cd alld-backend
docker build -t dba/backend:71 -f Dockerfile .
```

---

### Issue: Slow Startup (> 2 minutes)

**Check:**
```bash
# View startup logs
docker logs <container-name> 2>&1 | grep -E "INFO|WARN|ERROR"

# Check database connection
docker exec <container-name> wget -qO- http://db:3306
```

**Common causes:**
- Database not accessible
- Schema validation failing
- JVM memory issues

---

### Issue: Health Check Failing

**Check:**
```bash
# Container status
docker inspect <container-name> --format='{{.State.Health.Status}}'

# Recent errors
docker logs --tail 50 <container-name> | grep -i error
```

**Solution:**
- Wait for startup to complete (takes ~50 seconds)
- Check application logs for errors
- Verify database connectivity

---

## 📈 Monitoring

### Grafana Dashboards

- **Dev:** http://localhost:4001
- **Prod:** http://localhost:5001

### Key Metrics

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Startup Time | < 60s | 60-120s | > 120s |
| Memory Usage | < 75% | 75-90% | > 90% |
| CPU Usage | < 50% | 50-80% | > 80% |
| Health Check | UP | - | DOWN |

---

## 📝 Rollback Procedure

### Quick Rollback

```bash
# 1. Stop current container
docker stop <container-name>
docker rm <container-name>

# 2. Start previous version
docker run -d \
  --name <container-name> \
  --env-file .env \
  -p <port>:8081 \
  dba/backend:<previous-tag>
```

### Jenkins Rollback

1. Click "Build with Parameters"
2. Set `ROLLBACK: true`
3. Set `ROLLBACK_TAG: <previous-version>`
4. Click "Build"

---

## 🎯 Future Optimizations (Optional)

### Low Risk (Consider)

1. **Remove MySQL Dialect** (saves 0.2s)
   ```properties
   # Remove this line:
   # spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
   ```

2. **Lazy Initialization** (saves 5-10s, test first)
   ```properties
   spring.main.lazy-initialization=true
   ```

### Medium Risk (Later)

3. **Class Data Sharing (CDS)** (saves 10-15s)
4. **Hibernate Optimization** (saves 2-3s)

### High Risk (Not Recommended Yet)

5. **GraalVM Native Image** (saves 45-50s, but major rewrite)

---

## ✅ Release Checklist

### Pre-Deployment

- [x] Dev environment tested
- [x] Startup time < 60 seconds (achieved: 51 seconds)
- [x] No permission errors
- [x] Auto-build stage working
- [x] Health checks passing
- [ ] Production deployment (pending)

### Post-Deployment

- [ ] Container healthy
- [ ] Startup time < 60 seconds
- [ ] No errors in logs
- [ ] APIs responding
- [ ] Monitoring active

---

## 📞 Support

### Documentation

- This file: `RELEASE-NOTES.md`
- Architecture docs: `docs/`
- API docs: Swagger at `/dba-alld/swagger-ui.html`

### Useful Commands

```bash
# View all release notes
cat RELEASE-NOTES.md

# Search for specific issue
grep -i "permission" RELEASE-NOTES.md

# Find configuration
grep -A 5 "app.log.dir" src/main/resources/application-*.properties
```

---

**Release Version:** 2026-03-25  
**Status:** ✅ Production Ready  
**Next Review:** After production deployment  
**Maintained By:** Development Team
