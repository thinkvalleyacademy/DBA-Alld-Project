# 🚀 Push to Dev Branch & Deploy via Jenkins

**Complete guide to push code and trigger Jenkins deployment**

---

## ✅ Pre-flight Checklist

- [ ] Code reviewed and tested locally
- [ ] All E2E tests passing
- [ ] Jenkins running: http://localhost:4080/jenkins
- [ ] Git repository accessible

---

## 📝 Step 1: Review Changes

```bash
cd /Users/mukeshkumar/Desktop/TVA-application-devlopment/dba_alld_devlopment/dba-running-repos

# Check git status
git status

# Review changes
git diff
```

---

## 📝 Step 2: Add Files for Commit

```bash
# Add all changes
git add .

# Or add specific files
git add Jenkinsfile
git add jenkins-deploy.sh
git add update-jenkins-job.sh
git add agents.sh
git add JENKINS-DEPLOYMENT.md
git add LOCAL-TESTING-QUICKSTART.md
```

---

## 📝 Step 3: Commit to Dev Branch

```bash
# Checkout dev branch (or create if doesn't exist)
git checkout -b dev

# Or if dev branch exists
git checkout dev

# Commit changes
git commit -m "feat: Add Jenkins CI/CD pipeline with multi-agent deployment

- Jenkinsfile for pipeline orchestration
- Agent-based deployment (local/dev/prod)
- E2E test integration with Playwright
- Automated health checks
- CORS configuration for localhost:4000
- Login API integration (admin/dbaallahabad@123)

Features:
- Parameterized builds (environment selection)
- Build automation (Maven + npm)
- E2E test reporting
- Health check verification

Jenkins Job: dba-alld-deploy
Access: http://localhost:4080/jenkins/job/dba-alld-deploy/

Signed-off-by: Your Name <your.email@example.com>"
```

---

## 📝 Step 4: Push to Dev Branch

```bash
# Push to remote dev branch
git push origin dev

# Or if branch doesn't exist on remote
git push -u origin dev
```

---

## 📝 Step 5: Configure Jenkins Job (Manual - CSRF Workaround)

### Option A: Update Existing Job via UI

1. **Open Jenkins Job:**
   ```
   http://localhost:4080/jenkins/job/dba-alld-deploy/configure
   ```

2. **Configure Source Code Management:**
   - ✅ Git
   - Repository URL: `file:///Users/mukeshkumar/Desktop/TVA-application-devlopment/dba_alld_devlopment/dba-running-repos`
   - Branch: `*/dev`

3. **Configure Build Triggers:**
   - ✅ Poll SCM
   - Schedule: `* * * * *` (every minute)

4. **Configure Build:**
   - Click "Add build step" → "Execute shell"
   - Command:
     ```bash
     cd /Users/mukeshkumar/Desktop/TVA-application-devlopment/dba_alld_devlopment/dba-running-repos
     ./agents.sh all "Deploy to ${DEPLOY_ENV}"
     ```

5. **Add Parameters:**
   - Click "This project is parameterized" → "Add Parameter"
   - Add Choice Parameter:
     - Name: `DEPLOY_ENV`
     - Choices: `local` (newline) `dev`
   - Add Boolean Parameter:
     - Name: `RUN_TESTS`
     - Default: ✅ Checked
   - Add Boolean Parameter:
     - Name: `SKIP_BUILD`
     - Default: ☐ Unchecked

6. **Save**

---

### Option B: Create New Job via UI

1. **Create New Item:**
   ```
   http://localhost:4080/jenkins/view/all/newJob
   ```

2. **Enter item name:** `dba-alld-deploy-dev`

3. **Select:** ✅ Freestyle project

4. **Click:** OK

5. **Configure as per Option A above**

---

## 📝 Step 6: Trigger Build

### Via Jenkins UI (Recommended)

1. **Open Job:**
   ```
   http://localhost:4080/jenkins/job/dba-alld-deploy/
   ```

2. **Click:** "Build Now"

3. **Select Parameters:**
   - DEPLOY_ENV: `local` or `dev`
   - RUN_TESTS: ✅
   - SKIP_BUILD: ☐

4. **Click:** "Build"

5. **Watch Console:**
   - Click build number (e.g., #1)
   - Click "Console Output"

---

### Via Git Push (Automatic)

If you configured "Poll SCM", Jenkins will automatically build when you push:

```bash
# Make changes
git add .
git commit -m "fix: Some bug fix"
git push origin dev
```

Jenkins will detect the change within 1 minute and trigger a build.

---

### Via API (Advanced)

```bash
# Get CSRF crumb
CRUMB=$(curl -s -u admin:admin \
  "http://localhost:4080/jenkins/crumbIssuer/api/json" | \
  grep -o '"crumb":"[^"]*"' | cut -d'"' -f4)

# Trigger build
curl -X POST \
  -u admin:admin \
  -H "Jenkins-Crumb: ${CRUMB}" \
  -d "DEPLOY_ENV=local&RUN_TESTS=true" \
  "http://localhost:4080/jenkins/job/dba-alld-deploy/buildWithParameters"
```

---

## 📝 Step 7: Monitor Deployment

### Jenkins Console Output

```
http://localhost:4080/jenkins/job/dba-alld-deploy/lastBuild/console
```

### Expected Output

```
✅ Pre-deployment checks passed
✅ Backend build complete
✅ Backend started successfully
✅ Frontend started successfully
✅ Local deployment complete
🧪 Running E2E tests...
✅ All E2E tests passed
✅ Deployment completed successfully!
```

### Health Check

```bash
# Backend
curl http://localhost:3081/dba-alld/actuator/health

# Frontend
curl http://localhost:4000

# E2E Tests
cd DBA-SOFTWARE && ./run-e2e-tests.sh local
```

---

## 📝 Step 8: View Test Report

### Jenkins HTML Publisher

1. Open job: `http://localhost:4080/jenkins/job/dba-alld-deploy/`
2. Click on build number
3. Click "E2E Test Report"

### Local Report

```bash
cd DBA-SOFTWARE
npx playwright show-report
```

---

## 🛠️ Troubleshooting

### Jenkins Job Fails

**Check console output:**
```
http://localhost:4080/jenkins/job/dba-alld-deploy/lastBuild/console
```

**Common issues:**
- Docker not running: `colima start`
- Port in use: `lsof -ti :3081 | xargs kill -9`
- Database down: `docker ps | grep mysql`

### Git Push Fails

```bash
# Check remote
git remote -v

# Add remote if missing
git remote add origin file:///path/to/repo

# Force push (if needed)
git push -f origin dev
```

### Jenkins Doesn't Detect Push

- Check polling log: `http://localhost:4080/jenkins/job/dba-alld-deploy/pollLog`
- Verify branch: `*/dev`
- Check Git configuration in job

---

## 📊 Build Status

| Status | Meaning | Action |
|--------|---------|--------|
| 🟢 **SUCCESS** | All stages passed | Deployed successfully |
| 🟡 **UNSTABLE** | Tests failed | Review test report |
| 🔴 **FAILURE** | Build/deploy failed | Check console output |
| 🔵 **BUILDING** | In progress | Wait for completion |

---

## 🎯 Quick Commands Summary

```bash
# 1. Commit and push
git checkout dev
git add .
git commit -m "feat: Your feature"
git push origin dev

# 2. Trigger Jenkins (manual)
# Go to: http://localhost:4080/jenkins/job/dba-alld-deploy/
# Click "Build Now"

# 3. Monitor
# Console: http://localhost:4080/jenkins/job/dba-alld-deploy/lastBuild/console

# 4. Verify
curl http://localhost:3081/dba-alld/actuator/health
curl http://localhost:4000
```

---

## 📁 Files to Commit

Essential files for Jenkins deployment:

- ✅ `Jenkinsfile` - Pipeline definition
- ✅ `agents.sh` - Multi-agent orchestration
- ✅ `jenkins-deploy.sh` - Deployment script
- ✅ `start-local.sh` - Local startup
- ✅ `stop-local.sh` - Local shutdown
- ✅ `local-e2e-workflow.sh` - E2E workflow
- ✅ `LOCAL-TESTING-QUICKSTART.md` - Documentation
- ✅ `JENKINS-DEPLOYMENT.md` - Jenkins guide
- ✅ `update-jenkins-job.sh` - Job updater
- ✅ `alld-backend/src/main/java/com/dba/alld/config/CorsConfig.java` - CORS fix
- ✅ `DBA-SOFTWARE/tests/e2e/fixtures/test.config.js` - Test config
- ✅ `DBA-SOFTWARE/tests/e2e/login-e2e.spec.js` - Login tests

---

**Ready to push!** 🚀

Execute the commands in order and your code will be deployed via Jenkins!
