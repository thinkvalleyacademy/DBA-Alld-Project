# 🤖 Jenkins Agent Deployment Scenario

**DBA ALLD Project** - Automated deployment via Jenkins with agent coordination

---

## 🎯 Overview

This scenario demonstrates how Jenkins (running with `admin`/`admin`) can deploy the DBA ALLD application to local, dev, or prod environments using the multi-agent system.

---

## 📋 Prerequisites

| Service | URL | Credentials |
|---------|-----|-------------|
| **Jenkins** | http://localhost:4080/jenkins | admin / admin |
| **Backend** | http://localhost:3081/dba-alld | - |
| **Frontend** | http://localhost:4000 | - |
| **MySQL** | localhost:3307 | rwroot / root |

---

## 🚀 Quick Start

### Option 1: Via Jenkins UI

1. **Open Jenkins:** http://localhost:4080/jenkins

2. **Create New Job:**
   - Click "New Item"
   - Name: `dba-alld-deploy`
   - Select: "Freestyle project"
   - Click "OK"

3. **Configure Job:**
   - **Source Code Management:** Git
     - Repository URL: `file:///Users/mukeshkumar/Desktop/TVA-application-devlopment/dba_alld_devlopment/dba-running-repos`
   
   - **Build Triggers:** 
     - ✅ Poll SCM: `* * * * *`
     - ✅ Trigger builds remotely: `jenkins-deploy-token`
   
   - **Build Environment:**
     - ✅ Use secret text(s) or file(s)
   
   - **Build Steps:**
     - Execute shell:
       ```bash
       cd /Users/mukeshkumar/Desktop/TVA-application-devlopment/dba_alld_devlopment/dba-running-repos
       ./agents.sh all "Deploy to local"
       ```

4. **Save and Build**
   - Click "Save"
   - Click "Build Now"

---

### Option 2: Via Command Line (Agent Script)

```bash
cd /Users/mukeshkumar/Desktop/TVA-application-devlopment/dba_alld_devlopment/dba-running-repos

# Deploy to local via Jenkins agent
./jenkins-deploy.sh deploy local

# Deploy to dev via Jenkins agent
./jenkins-deploy.sh deploy dev

# Check status
./jenkins-deploy.sh status
```

---

### Option 3: Via Multi-Agent System

```bash
# Direct deployment (no Jenkins)
./agents.sh devops deploy local

# Jenkins-assisted deployment
./agents.sh devops deploy local jenkins

# Full workflow with Jenkins
./agents.sh all "Deploy to local via Jenkins"
```

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `Jenkinsfile` | Pipeline definition for Jenkins |
| `jenkins-deploy.sh` | Agent deployment script |
| `agents.sh` | Updated with Jenkins integration |

---

## 🔄 Deployment Workflow

### Local Deployment

```
┌─────────────┐
│   Jenkins   │
│  (Trigger)  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  DevOps Agent   │
│  (Orchestrate)  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Build Backend  │
│   (Maven)       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Start Services │
│  (Docker + npm) │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Run E2E Tests  │
│  (Playwright)   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Health Check   │
│  (API + UI)     │
└─────────────────┘
```

---

## 🎯 Jenkins Pipeline Stages

### 1. **Checkout**
- Pull latest code from Git repository

### 2. **Pre-deployment Checks**
- Verify Docker is running
- Check database connectivity
- Validate environment

### 3. **Build Backend**
- Maven clean package
- Skip tests (already tested)
- Archive JAR artifact

### 4. **Build Frontend** (Optional)
- npm install
- npm run build
- Archive build artifacts

### 5. **Deploy to Environment**
- Stop existing services
- Start new backend
- Start new frontend
- Wait for health checks

### 6. **Run E2E Tests** (Optional)
- Install Playwright browsers
- Run test suite
- Generate HTML report

### 7. **Health Check**
- Verify backend: `/actuator/health`
- Verify frontend: `http://localhost:4000`
- Verify database: Docker container

---

## 📊 Build Parameters

When triggering a build, you can configure:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `DEPLOY_ENV` | Choice | local | Target environment (local/dev/prod) |
| `RUN_TESTS` | Boolean | true | Run E2E tests after deployment |
| `BUILD_BACKEND` | Boolean | true | Build backend application |
| `BUILD_FRONTEND` | Boolean | false | Build frontend application |

---

## 🔧 Jenkins Configuration

### Job URL
```
http://localhost:4080/jenkins/job/dba-alld-deploy/
```

### API Access
```bash
# Trigger build via API
curl -X POST \
  -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{"DEPLOY_ENV": "local", "RUN_TESTS": true}' \
  http://localhost:4080/jenkins/job/dba-alld-deploy/buildWithParameters
```

### Webhook Integration
```bash
# Setup webhook listener
./jenkins-deploy.sh setup

# Webhook endpoint
http://localhost:8085/trigger
```

---

## 🧪 Testing the Deployment

### Manual Verification

```bash
# 1. Check backend health
curl http://localhost:3081/dba-alld/actuator/health

# 2. Check frontend
curl http://localhost:4000

# 3. Run E2E tests
cd DBA-SOFTWARE
./run-e2e-tests.sh local
```

### Via Jenkins

1. Open Jenkins job: http://localhost:4080/jenkins/job/dba-alld-deploy/
2. Click "Build Now"
3. Watch console output
4. Check E2E test report

---

## 📈 Build Status Indicators

| Status | Meaning |
|--------|---------|
| 🟢 **SUCCESS** | Deployment completed, all tests passed |
| 🟡 **UNSTABLE** | Deployment succeeded, some tests failed |
| 🔴 **FAILURE** | Deployment failed, rollback may be needed |
| 🔵 **BUILDING** | Deployment in progress |

---

## 🛠️ Troubleshooting

### Jenkins Job Fails

**Check Jenkins logs:**
```bash
docker logs jenkins-master --tail 100
```

**Check build console:**
```
http://localhost:4080/jenkins/job/dba-alld-deploy/lastBuild/console
```

### Services Won't Start

**Check if ports are in use:**
```bash
lsof -i :3081
lsof -i :4000
```

**Kill existing processes:**
```bash
lsof -ti :3081 | xargs kill -9
lsof -ti :4000 | xargs kill -9
```

### E2E Tests Fail

**View test report:**
```bash
cd DBA-SOFTWARE
npx playwright show-report
```

**Check test logs:**
```bash
cat DBA-SOFTWARE/test-results/output/*/video.webm
```

---

## 🎯 Example Scenarios

### Scenario 1: Deploy Latest Code to Local

```bash
# Via agent script
./jenkins-deploy.sh deploy local

# Via Jenkins UI
1. Open http://localhost:4080/jenkins/job/dba-alld-deploy/
2. Click "Build Now"
3. Select parameters: DEPLOY_ENV=local, RUN_TESTS=true
4. Click "Build"
```

### Scenario 2: Deploy Without Tests

```bash
# Via agent script
./jenkins-deploy.sh trigger local

# Via Jenkins API
curl -X POST \
  -u admin:admin \
  -d "DEPLOY_ENV=local&RUN_TESTS=false" \
  http://localhost:4080/jenkins/job/dba-alld-deploy/buildWithParameters
```

### Scenario 3: Full E2E Validation

```bash
# Via multi-agent
./agents.sh all "Deploy and test locally"

# This will:
# 1. Build backend
# 2. Deploy to local
# 3. Run E2E tests
# 4. Generate report
```

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-08 | Initial Jenkins integration |
| 1.1 | 2026-03-08 | Added agent orchestration |

---

**Maintained By:** DevOps Team
**Status:** ✅ Active
**Jenkins Version:** LTS
**Next Review:** After production deployment
