# DBA ALLD Backend - Project Context

**Purpose:** This file maintains context for AI assistants to understand the project history, decisions, and current state without needing to read previous conversation history.

---

## 🎯 Project Overview

**Name:** DBA ALLD (Automated Legal Land Documentation)  
**Type:** Spring Boot Backend Application  
**Java Version:** 21  
**Spring Boot Version:** 3.4.5  
**Database:** MySQL 8.0  
**Deployment:** Docker (Rootless)  
**Environments:** Dev (port 5081), Prod (port 5281)

---

## 📊 Current Status (as of 2026-03-25)

### ✅ Completed Optimizations

| Optimization | Status | Impact |
|--------------|--------|--------|
| Startup time: 590s → 51s | ✅ Done | 92% faster |
| Rootless Docker | ✅ Done | Security improved |
| Log permissions fixed | ✅ Done | No more errors |
| Auto-build in Jenkins | ✅ Done | Zero manual intervention |
| Health check timeout | ✅ Done | 60s (was 20s) |

### 🎯 Current Performance

```
Startup Time: 51 seconds (consistent)
Target: < 60 seconds ✅ ACHIEVED
Previous: 590 seconds (9.8 minutes)
Improvement: 92% faster
```

---

## 🏗️ Architecture

### Technology Stack

- **Framework:** Spring Boot 3.4.5
- **Language:** Java 21
- **Database:** MySQL 8.0
- **ORM:** Hibernate 6.6.13
- **Security:** Spring Security + JWT
- **Logging:** Log4j2
- **Monitoring:** Prometheus + Grafana
- **Container:** Docker (rootless, non-root user)

### Key Components

```
alld-backend/
├── src/main/java/com/dba/alld/
│   ├── controller/       # REST API endpoints
│   ├── service/          # Business logic
│   ├── repository/       # JPA repositories (11 total)
│   ├── entity/           # Database entities
│   ├── config/           # Security, CORS, JWT config
│   └── AlldApplication.java
├── src/main/resources/
│   ├── application.properties (base config)
│   ├── application-dev.properties (dev env)
│   ├── application-prod.properties (prod env)
│   └── log4j2-spring.xml (logging config)
├── deployment/
│   ├── Dockerfile
│   ├── docker-compose.backend.dev.yml
│   ├── docker-compose.backend.prod.yml
│   ├── Jenkinsfile.backend.dev
│   └── Jenkinsfile.backend.prod
└── RELEASE-NOTES.md (single source of truth)
```

---

## 🔧 Critical Configuration

### Database Configuration

```properties
# Dev
spring.datasource.url=jdbc:mysql://db:3306/dba
spring.datasource.username=rwroot
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}

# Both environments
spring.jpa.hibernate.ddl-auto=validate  # NOT update (critical for performance)
spring.jpa.show-sql=false  # Disabled for performance
```

### Log Configuration

```properties
# Log directory (rootless-compatible)
app.log.dir=${APP_LOG_DIR:/app/logs}

# Volume mount in docker-compose:
# ./backend-logs:/app/logs
```

### JVM Configuration

```dockerfile
# Dockerfile ENTRYPOINT
java -XX:+UseContainerSupport \
     -XX:MaxRAMPercentage=75.0 \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -XX:+ParallelRefProcEnabled \
     -Djava.security.egd=file:/dev/./urandom \
     -jar app.jar
```

---

## 🚀 Deployment Process

### Jenkins Pipeline Flow

```
1. Checkout Code
2. Detect Changes → Sets BUILD_IMAGE_NEEDED
3. Run Unit Tests (optional)
4. Build Docker Image (if needed)
5. Ensure Image Available ⭐ (auto-builds if missing)
6. Write Environment File
7. Deploy Backend + DB
8. Health Check (60s timeout)
```

### Key Jenkins Stages

**Ensure Image Available:** Auto-builds missing images before deployment
- Prevents "No such image" errors
- Builds with both build number tag and env tag (dev/prod)
- Always runs (safety net)

**Deploy Backend:** No `--pull never` flag
- Relies on Ensure Image Available stage
- Uses `--force-recreate` for clean deployment

---

## 📁 Single Source of Truth

**Main Documentation:** `alld-backend/RELEASE-NOTES.md`

This file contains:
- All release notes
- Performance optimizations
- Configuration changes
- Deployment guide
- Troubleshooting
- Rollback procedures

**DO NOT CREATE** additional `.md` files. Update `RELEASE-NOTES.md` instead.

---

## 🔍 Common Issues & Solutions

### Issue: Permission Denied on Logs

**Root Cause:** Using `/var/log/dba-alld` requires root

**Solution:** Use `/app/logs` (owned by appuser)

**Files Updated:**
- `Dockerfile`: `mkdir -p /app/logs && chown appuser:appgroup /app/logs`
- `application-*.properties`: `app.log.dir=/app/logs`
- `docker-compose.*.yml`: Volume mount to `/app/logs`

---

### Issue: "No such image" Error

**Root Cause:** Build stage skipped but image doesn't exist

**Solution:** "Ensure Image Available" stage in Jenkins auto-builds

**Files Updated:**
- `Jenkinsfile.backend.dev`: Added stage
- `Jenkinsfile.backend.prod`: Added stage

---

### Issue: Slow Startup (> 2 minutes)

**Root Cause:** `ddl-auto=update` validates schema on every startup

**Solution:** Changed to `ddl-auto=validate`

**Impact:** 590s → 51s (92% faster)

**Files Updated:**
- `application-dev.properties`
- `application-prod.properties`

---

## 🎯 Performance Benchmarks

### Expected Startup Time

```
Total: 45-55 seconds
Breakdown:
- Repository Scan: ~0.3s
- Web Context Init: ~9.5s
- Hibernate Init: ~11s
- DB Connection: ~1.6s
- Security Config: ~3s
- Tomcat Start: ~2.5s
- Bean Creation: ~15s
- Other: ~8s
```

### Alert Thresholds

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Startup Time | < 60s | 60-120s | > 120s |
| Memory Usage | < 75% | 75-90% | > 90% |
| Health Check | UP | - | DOWN |

---

## 🔐 Security Configuration

### Non-Root User

```dockerfile
# Dockerfile
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
RUN chown -R appuser:appgroup /app
USER appuser
```

**Benefits:**
- ✅ Security best practice
- ✅ Rootless Docker compatible
- ✅ No permission issues (when using /app/logs)

---

## 📊 Monitoring

### Endpoints

```
Health: /actuator/health
Metrics: /actuator/prometheus
Info: /actuator/info
```

### Ports

```
Dev:
- Application: 5081
- Management: 4090

Prod:
- Application: 5281
- Management: 5090
```

### Grafana Dashboards

```
Dev: http://localhost:4001
Prod: http://localhost:5001
```

---

## 🧪 Testing

### Unit Tests

```bash
./mvnw test
```

### Integration Tests

```bash
./mvnw verify
```

### Manual Testing

```bash
# Health check
curl http://localhost:5081/dba-alld/actuator/health

# Login endpoint
curl -X POST http://localhost:5081/dba-alld/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

---

## 📝 Change Management

### How to Update RELEASE-NOTES.md

When making changes:

1. **Add to "Latest Release" section** with date
2. **Update "Current Status" table** if metrics change
3. **Document in appropriate section:**
   - Performance improvements → "Performance Optimizations"
   - Bug fixes → "Troubleshooting"
   - Config changes → "Configuration Changes"
   - New features → "Architecture"

### What NOT to Do

- ❌ Don't create new `.md` files for every change
- ❌ Don't duplicate information across files
- ❌ Don't remove old release notes (keep history)

---

## 🎯 Future Considerations

### Optional Optimizations (Low Priority)

Current startup (51s) is acceptable. Further optimizations are optional:

1. **Remove MySQL Dialect** (saves 0.2s, zero risk)
2. **Lazy Initialization** (saves 5-10s, low risk, test first)
3. **Component Scan Optimization** (saves 1-2s, zero risk)

### Not Recommended Yet

- **GraalVM Native Image** (saves 45s, but high risk/effort)
- **Aggressive CDS** (saves 10s, medium risk)

**Recommendation:** Ship and focus on feature development. 51s is excellent for Spring Boot.

---

## 📞 Quick Reference

### Build Commands

```bash
# Dev
docker build -t dba/backend:dev -f Dockerfile .

# Prod
docker build -t dba/backend:prod -f Dockerfile .
```

### Deploy Commands

```bash
# Dev
docker-compose -f docker-compose.backend.dev.yml up -d

# Prod
docker-compose -f docker-compose.backend.prod.yml up -d
```

### Log Commands

```bash
# Follow logs
docker logs -f <container-name>

# View startup time
docker logs <container-name> 2>&1 | grep "Started AlldApplication"

# Check host logs (dev)
tail -f /home/dbadev01/app-deployment-dev/backend-logs/application.log
```

### Health Check Commands

```bash
# Dev
curl http://localhost:5081/dba-alld/actuator/health

# Prod
curl -k https://localhost:5281/dba-alld/actuator/health
```

---

## 📚 Documentation Index

| Document | Location | Purpose |
|----------|----------|---------|
| **Release Notes** | `alld-backend/RELEASE-NOTES.md` | Single source of truth |
| **Project Context** | `alld-backend/.qwen/PROJECT-CONTEXT.md` | AI assistant context |
| **AGENTS Guide** | `AGENTS.md` | Multi-agent workflow |
| **Quick Start** | `QUICKSTART.md` | Getting started guide |

---

**Last Updated:** 2026-03-25  
**Maintained By:** Development Team  
**Review Cycle:** After each deployment  
**Status:** ✅ Production Ready
