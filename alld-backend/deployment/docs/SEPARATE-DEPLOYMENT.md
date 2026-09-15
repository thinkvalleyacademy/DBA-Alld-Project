# ✅ Separate Frontend & Backend Deployment

**Jenkins pipeline updated to deploy frontend and backend separately for all environments!**

---

## 🎯 What's New

### **Separate Deployment Controls**

You can now deploy frontend and backend **independently**:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `DEPLOY_BACKEND` | ✅ true | Deploy backend application |
| `DEPLOY_FRONTEND` | ✅ true | Deploy frontend application |
| `RUN_TESTS` | ✅ true | Run E2E tests after deployment |
| `SKIP_BUILD` | ☐ false | Skip build phase |

---

## 📊 Pipeline Stages (Separated)

```
1. Checkout                    → Pull code from Git
2. Set Image Tag              → Generate version
3. Pre-deployment Checks      → Verify Docker
4. Build Backend              → Maven package (if DEPLOY_BACKEND=true)
5. Build Frontend             → npm build (if DEPLOY_FRONTEND=true)
6. Run Unit Tests             → Maven test
7. Build Backend Docker Image → For dev/preprod/prod
8. Build Frontend Docker Image→ For dev/preprod/prod
9. Approve Prod Deploy        → Manual approval (prod only)
10. Deploy Backend            → Local OR Server (if DEPLOY_BACKEND=true)
11. Deploy Frontend           → Local OR Server (if DEPLOY_FRONTEND=true)
12. Run E2E Tests             → Playwright (local only)
13. Health Check - Backend    → Verify backend
14. Health Check - Frontend   → Verify frontend
```

---

## 🚀 Usage Scenarios

### **Scenario 1: Deploy Both (Default)**

```
Parameters:
- DEPLOY_BACKEND: ✅ true
- DEPLOY_FRONTEND: ✅ true
- RUN_TESTS: ✅ true
- SKIP_BUILD: ☐ false

Result:
✅ Backend builds and deploys
✅ Frontend builds and deploys
✅ E2E tests run
✅ Both health checks pass
```

---

### **Scenario 2: Backend Only**

```
Parameters:
- DEPLOY_BACKEND: ✅ true
- DEPLOY_FRONTEND: ☐ false
- RUN_TESTS: ☐ false
- SKIP_BUILD: ☐ false

Result:
✅ Backend builds and deploys
⏭️ Frontend skipped
⏭️ E2E tests skipped
✅ Backend health check passes
```

**Use case:** Backend bug fix, frontend unchanged

---

### **Scenario 3: Frontend Only**

```
Parameters:
- DEPLOY_BACKEND: ☐ false
- DEPLOY_FRONTEND: ✅ true
- RUN_TESTS: ✅ true
- SKIP_BUILD: ☐ false

Result:
⏭️ Backend skipped
✅ Frontend builds and deploys
✅ E2E tests run (uses existing backend)
✅ Frontend health check passes
```

**Use case:** UI changes, backend unchanged

---

### **Scenario 4: Quick Redeploy**

```
Parameters:
- DEPLOY_BACKEND: ✅ true
- DEPLOY_FRONTEND: ✅ true
- RUN_TESTS: ☐ false
- SKIP_BUILD: ✅ true

Result:
⏭️ Build skipped (uses existing artifacts)
✅ Backend redeploys
✅ Frontend redeploys
⏭️ E2E tests skipped
✅ Both health checks pass
```

**Use case:** Quick restart after configuration change

---

## 🎯 Environment-Specific Deployment

### **Local Environment**

**Backend:**
- Runs on: `http://localhost:3081/dba-alld`
- Method: `java -jar` direct execution
- Database: `localhost:3307/dba`

**Frontend:**
- Runs on: `http://localhost:4000`
- Method: `npm start`
- API URL: `http://localhost:3081`

---

### **Dev Environment**

**Backend:**
- Runs on: Dev server
- Method: Docker Compose
- Image: `dba/backend:dev`
- Config: `APP_DIR_DEV`, `FRONTEND_DIR_DEV`

**Frontend:**
- Runs on: Dev server
- Method: Docker Compose
- Image: `dba/frontend:dev`
- Config: `FRONTEND_DIR_DEV`

---

### **Prod Environment**

**Backend:**
- Runs on: Prod server
- Method: Docker Compose
- Image: `dba/backend:prod`
- Requires: Manual approval

**Frontend:**
- Runs on: Prod server
- Method: Docker Compose
- Image: `dba/frontend:prod`
- Requires: Manual approval

---

## ⚙️ Jenkins Configuration

### **Required Environment Variables**

Configure in **Jenkins > Configure System > Global properties**:

| Variable | Local | Dev | Prod |
|----------|-------|-----|------|
| `APP_DIR_DEV` | N/A | `/home/dbadev01/dba-dev-testing/deploy-dba_alld_project` | - |
| `APP_DIR_PROD` | N/A | - | `/path/to/prod/backend` |
| `FRONTEND_DIR_DEV` | N/A | `/home/dbadev01/dba-dev-testing/deploy-dba-frontend` | - |
| `FRONTEND_DIR_PROD` | N/A | - | `/path/to/prod/frontend` |
| `ENV_FILE_DEV` | N/A | `env/dev.env` | - |
| `ENV_FILE_PROD` | N/A | - | `env/prod.env` |

---

## 📁 Docker Compose Files

### **Backend Deployment** (`deployment/docker-compose.backend.yml`)

```yaml
version: '3.8'

services:
  backend:
    image: dba/backend:${TAG:-latest}
    container_name: dba-${DEPLOY_ENV:-dev}-backend
    ports:
      - "${BACKEND_PORT:-3081}:8081"
    environment:
      - SPRING_PROFILES_ACTIVE=${DEPLOY_ENV:-dev}
      - SPRING_DATASOURCE_URL=${SPRING_DATASOURCE_URL}
      - SPRING_DATASOURCE_USERNAME=${SPRING_DATASOURCE_USERNAME}
      - SPRING_DATASOURCE_PASSWORD=${SPRING_DATASOURCE_PASSWORD}
```

### **Frontend Deployment** (`deployment/docker-compose.frontend.yml`)

```yaml
version: '3.8'

services:
  frontend:
    image: dba/frontend:${TAG:-latest}
    container_name: dba-${DEPLOY_ENV:-dev}-frontend
    ports:
      - "${FRONTEND_PORT:-4000}:80"
    environment:
      - NODE_ENV=${DEPLOY_ENV:-dev}
      - REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:3081}
```

---

## 🧪 Test Scenarios

### **Test 1: Deploy Backend Only**

```bash
# Jenkins UI
1. Go to: http://localhost:4080/jenkins/job/dba-alld-deploy/build
2. Set parameters:
   - DEPLOY_ENV: local
   - DEPLOY_BACKEND: ✅ true
   - DEPLOY_FRONTEND: ☐ false
   - RUN_TESTS: ☐ false
3. Click "Build"
4. Verify: http://localhost:3081/dba-alld/actuator/health
```

---

### **Test 2: Deploy Frontend Only**

```bash
# Jenkins UI
1. Go to: http://localhost:4080/jenkins/job/dba-alld-deploy/build
2. Set parameters:
   - DEPLOY_ENV: local
   - DEPLOY_BACKEND: ☐ false
   - DEPLOY_FRONTEND: ✅ true
   - RUN_TESTS: ☐ false
3. Click "Build"
4. Verify: http://localhost:4000
```

---

### **Test 3: Deploy Both with Tests**

```bash
# Jenkins UI
1. Go to: http://localhost:4080/jenkins/job/dba-alld-deploy/build
2. Set parameters:
   - DEPLOY_ENV: local
   - DEPLOY_BACKEND: ✅ true
   - DEPLOY_FRONTEND: ✅ true
   - RUN_TESTS: ✅ true
3. Click "Build"
4. Verify:
   - Backend: http://localhost:3081/dba-alld/actuator/health
   - Frontend: http://localhost:4000
   - E2E Report: Jenkins job page
```

---

## 📊 Expected Console Output

### **Deploy Both (Local)**

```
✅ Pre-deployment checks passed
🔨 Building backend application...
🎨 Building frontend application...
🧪 Running unit tests...
🚀 Deploying backend to local environment...
✅ Backend started successfully
🎨 Deploying frontend to local environment...
✅ Frontend started successfully
🧪 Running E2E tests...
✅ 12 tests passed
🏥 Checking backend health...
✅ Backend healthy
🏥 Checking frontend health...
✅ Frontend accessible

✅ Backend deployed | ✅ Frontend deployed | Deployment to local completed successfully!
```

---

### **Backend Only (Dev)**

```
✅ Pre-deployment checks passed
🔨 Building backend application...
🧪 Running unit tests...
🐳 Building backend Docker image...
🚀 Deploying backend to dev environment...
✅ Backend deployment to dev complete
🏥 Checking backend health...
✅ Backend healthy

✅ Backend deployed | ⏭️ Frontend skipped | Deployment to dev completed successfully!
```

---

## 🛠️ Troubleshooting

### **Backend Deployment Fails**

**Check:**
```bash
# Local logs
tail -f backend-deploy.log

# Docker logs (dev/prod)
docker logs dba-dev-backend
```

**Common issues:**
- Port in use: `lsof -ti :3081 | xargs kill -9`
- Database down: `docker ps | grep mysql`
- Missing env vars: Check Jenkins configuration

---

### **Frontend Deployment Fails**

**Check:**
```bash
# Local logs
tail -f frontend-deploy.log

# Docker logs (dev/prod)
docker logs dba-dev-frontend
```

**Common issues:**
- Port in use: `lsof -ti :4000 | xargs kill -9`
- Backend not reachable: Check API URL
- Build errors: Check Node.js version

---

### **E2E Tests Fail**

**View report:**
```bash
cd DBA-SOFTWARE
npx playwright show-report
```

**Common issues:**
- Backend not running: Deploy backend first
- Frontend not running: Deploy frontend first
- Wrong credentials: Check test.config.js

---

## ✅ Summary

### **What You Can Do Now:**

1. ✅ Deploy backend independently
2. ✅ Deploy frontend independently
3. ✅ Deploy both together
4. ✅ Skip builds for quick redeploy
5. ✅ Separate health checks for each
6. ✅ Local, dev, and prod support

---

### **Jenkins Parameters:**

| Parameter | When to Use |
|-----------|-------------|
| `DEPLOY_BACKEND=true` | Backend changes |
| `DEPLOY_FRONTEND=true` | Frontend changes |
| `BOTH=true` | Full deployment |
| `SKIP_BUILD=true` | Quick redeploy |
| `RUN_TESTS=false` | Skip E2E (backend-only deploy) |

---

### **Files Created:**

- ✅ `alld-backend/Jenkinsfile` - Enhanced pipeline
- ✅ `alld-backend/deployment/docker-compose.backend.yml` - Backend deployment
- ✅ `alld-backend/deployment/docker-compose.frontend.yml` - Frontend deployment
- ✅ `alld-backend/JENKINS-PIPELINE-READY.md` - Documentation

---

**Your Jenkins pipeline now supports separate frontend and backend deployment for all environments!** 🚀
