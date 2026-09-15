# Local Jenkins Pipeline - Quick Reference

## 🚀 Quick Start

### First Time Setup (5 minutes)
```bash
# 1. Start Jenkins
docker run -d --name jenkins-local -p 8081:8080 \
  -v jenkins-data:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts

# 2. Get password & login at http://localhost:8081
docker logs jenkins-local | grep "password"

# 3. Create job "DBA-ALLD-Backend-Local"
# - Pipeline from SCM
# - Script path: deployment/Jenkinsfile.backend.local
# - Branch: dev
```

---

## Pipeline Actions (Choose One)

| Action | Use Case | Builds Image | Runs Tests | Recreates DB |
|--------|----------|-------------|-----------|--------------|
| **deploy** | Normal build & deploy | ✅ Yes | ✅ Yes | ❌ No |
| **rebuild** | Fresh rebuild (new DB) | ✅ Yes | ✅ Yes | ✅ Yes |
| **restart** | Quick restart (no build) | ❌ No | ❌ No | ❌ No |
| **logs** | View recent logs | ❌ No | ❌ No | ❌ No |
| **rollback** | Go to previous version | ❌ No | ❌ No | ❌ No |

---

## 📋 Common Build Scenarios

### Scenario 1: Fresh Start (New Database)
```
Action: rebuild
Run Tests: ✓
Force Build: ✓
Create DB Backup: ✓
```
**Time**: ~3-5 minutes

### Scenario 2: Regular Deployment
```
Action: deploy
Run Tests: ✓
Force Build: empty
Create DB Backup: ✓
```
**Time**: ~2-3 minutes

### Scenario 3: Quick Test Build (no deploy)
```
Action: deploy
Run Tests: ✓
Force Build: ✓
Create DB Backup: empty
Backend Port: 8080
```
**Time**: ~1-2 minutes

### Scenario 4: Just Restart (Changes in Config)
```
Action: restart
```
**Time**: ~10 seconds

### Scenario 5: Revert Last Deployment
```
Action: rollback
```
**Time**: ~20 seconds

---

## Docker Container Management

### View Status
```bash
# List running containers
docker ps | grep alld

# Detailed status
docker compose -f ~/dist/docker-compose.backend.dev.yml ps
```

### Backend Operations
```bash
# View logs (last 50 lines)
docker logs -f alld-backend-local

# Stop backend
docker stop alld-backend-local

# Restart backend
docker restart alld-backend-local

# Access shell
docker exec -it alld-backend-local bash
```

### Database Operations
```bash
# View DB logs
docker logs -f alld-db-local

# Access MySQL
docker exec -it alld-db-local mysql -u root -p

# Export database
docker exec alld-db-local mysqldump -u root -p dba_dev > backup.sql

# Restore database
docker exec -i alld-db-local mysql -u root -p < backup.sql
```

---

## 🌐 Access URLs

```
API Base:        http://localhost:8080/dba-alld
Health Check:    http://localhost:8080/dba-alld/actuator/health
Swagger UI:      http://localhost:8080/dba-alld/swagger-ui.html
Database (local): localhost:3306
```

---

## Build Parameters

### IMAGE_TAG
- Leave empty to use BUILD_NUMBER
- Example: `v1.0.0`, `build-123`

### RUN_TESTS
- `true`: Execute Maven tests (recommended)
- `false`: Skip tests (faster, but risky)

### FORCE_BUILD
- `true`: Rebuild even if no code changes detected
- `false`: Skip build if no changes

### SKIP_TESTS_ON_ERROR
- `true`: Continue deployment even if tests fail
- `false`: Stop if tests fail (recommended)

### DEPLOYMENT_ACTION
```
deploy    → Normal deploy (build + test + deploy)
rebuild   → Full rebuild with fresh database
restart   → Quick container restart (no rebuild)
logs      → Show last 50 log lines
rollback  → Revert to previous Docker image
```

### CREATE_DB_BACKUP
- `true`: Create backup before deploy (recommended)
- `false`: Skip backup

### BACKEND_PORT
- Default: 8080
- Change if port is in use

### DB_PORT
- Default: 3306
- Change if port is in use

---

## 📊 Build Stages

1. **Initialization** (30s)
   - Validates build parameters
   - Sets environment variables

2. **Verify Local Code** (10s)
   - ✅ Checks that pom.xml, Dockerfile, mvnw exist
   - ✅ Verifies code is available locally
   - No Git checkout needed!

3. **Validate Environment** (20s)
   - Checks Docker & Docker Compose
   - Creates Docker network

4. **Build** (30s)
   - Maven clean compile

5. **Unit Tests** (1-2m)
   - Runs JUnit tests
   - Reports test results

6. **Package** (1-2m)
   - Maven package (creates JAR)

7. **Database Backup** (30s)
   - Creates SQL dump if DB running

8. **Build Docker Image** (1-2m)
   - Creates Docker image from JAR

9. **Deploy** (1-2m)
   - Starts containers with Docker Compose

10. **Verify** (1-2m)
    - Health checks
    - Confirms container is running

**Total Time**: ~4-7 minutes (normal deploy)

---

## 🔧 Troubleshooting Checklist

### "pom.xml not found" Error
```bash
# The Jenkinsfile couldn't find your code
# Check if CODE_ROOT points to correct location
echo $CODE_ROOT

# Solution 1: Copy code to workspace
cp -r /path/to/alld-backend /var/jenkins_home/workspace/DBA-ALLD-Backend-Local

# Solution 2: Create symlink
ln -s /path/to/alld-backend /var/jenkins_home/workspace/DBA-ALLD-Backend-Local

# Solution 3: Update CODE_ROOT in Jenkinsfile
# Edit: CODE_ROOT = "/correct/path/to/alld-backend"
```

### Build Fails During Compilation
```bash
# Check if Java 21 is required
grep "maven.compiler.source" pom.xml

# Solution: Run build in Docker (has Java 21)
# Or compile locally with: mvn clean compile
```

### Tests Fail
```bash
# View test results
docker logs alld-backend-local

# Run specific test
./mvnw test -Dtest=ReCaptchaServiceTest

# Skip tests to continue
# Set: RUN_TESTS = false or SKIP_TESTS_ON_ERROR = true
```

### Container Won't Start
```bash
# Check logs
docker logs -f alld-backend-local

# Check environment
docker exec alld-backend-local env | grep -i mysql

# Verify database connection
docker inspect alld-backend-local | grep -A 10 Health
```

### Port Already in Use
```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>

# Or use different port in Jenkins (BACKEND_PORT param)
```

### Database Connection Issues
```bash
# Check if DB is running
docker ps | grep alld-db-local

# Check DB health
docker inspect alld-db-local | grep -A 5 Health

# Test connection
docker exec alld-db-local mysql -u root -p -e "SELECT 1;"
```

---

## 📈 Performance Tips

1. **Cache Maven Dependencies**
   ```bash
   # Pre-fill Maven cache
   ./mvnw verify -DskipTests
   
   # Subsequent builds will be faster
   ```

2. **Skip Tests for Faster Builds**
   - Set RUN_TESTS = false
   - Use only during development

3. **Use Rollback Instead of Rebuild**
   - Quick rollback if something breaks
   - Don't rebuild unnecessarily

4. **Monitor Disk Space**
   ```bash
   # Clean up old Docker images
   docker image prune -a
   
   # Remove unused volumes
   docker volume prune
   ```

---

## 🚨 Emergency Procedures

### Stuck Build (Kill It)
```bash
# In Jenkins: Click "Stop" button
# Or via Docker:
docker stop jenkins-local
docker start jenkins-local
```

### Total Reset (Start Over)
```bash
# Remove all containers/volumes
docker compose -f ~/dist/docker-compose.backend.dev.yml down -v

# Remove Docker image
docker rmi localhost/alld/backend

# Clear Jenkins workspace
rm -rf ~/dist

# Start fresh deploy
# Run Jenkins job with: rebuild=true
```

### Corrupted Database
```bash
# Rebuild with fresh database
# Set: DEPLOYMENT_ACTION = rebuild

# Or manual fix:
docker rm alld-db-local
docker compose -f ~/dist/docker-compose.backend.dev.yml up -d db
```

---

## 📋 Operational Checklist

- [ ] Docker running (`docker ps` works)
- [ ] Jenkins accessible (`http://localhost:8081`)
- [ ] Job "DBA-ALLD-Backend-Local" created
- [ ] Local code available (pom.xml, Dockerfile, mvnw exist)
- [ ] CODE_ROOT points to correct backend directory
- [ ] Script path set to `deployment/Jenkinsfile.backend.local`
- [ ] Backend port is available (default 8080)
- [ ] Parameters defined (IMAGE_TAG, RUN_TESTS, etc.)
- [ ] Docker socket permissions correct
- [ ] Port 8080 available for backend
- [ ] Port 3306 available for database

---

## 🎯 Success Indicators

✅ **Build Successful**
- All stages complete "green"
- No errors in console output

✅ **Deployment Running**
- Containers visible: `docker ps | grep alld`
- Health check: `curl http://localhost:8080/dba-alld/actuator/health`

✅ **Database Connected**
- No "Connection refused" errors
- Health check shows "UP"

✅ **Ready for Testing**
- Test endpoints: `curl http://localhost:8080/dba-alld/api/v1/health`
- View Swagger: `http://localhost:8080/dba-alld/swagger-ui.html`

---

## 📚 Related Files

- **Main Jenkinsfile**: `deployment/Jenkinsfile.backend.local`
- **Docker Compose**: `deployment/docker-compose.backend.dev.yml`
- **Setup Guide**: `deployment/JENKINS_LOCAL_SETUP.md`
- **Application Config**: `src/main/resources/application.properties`

---

## 🆘 Getting Help

1. **Check logs**
   ```bash
   docker logs alld-backend-local  # Backend logs
   docker logs jenkins-local       # Jenkins logs
   ```

2. **View health status**
   ```bash
   curl http://localhost:8080/dba-alld/actuator/health
   ```

3. **Check database connection**
   ```bash
   docker exec alld-db-local mysql -u alld_user -p -e "SELECT 1;"
   ```

4. **Review Jenkins console output**
   - Click Build → Console Output
   - Scroll through all stages

---

**You're all set! Start building and deploying! 🚀**
