# 🚀 DBA ALLD - Local E2E Testing Quickstart

**Complete guide to testing your application end-to-end in local environment**

---

## ⚡ Quick Start (3 Steps)

### Step 1: Stop existing processes

```bash
cd /Users/mukeshkumar/Desktop/TVA-application-devlopment/dba_alld_devlopment/dba-running-repos

# Kill existing frontend on port 3000
lsof -ti :3000 | xargs kill -9 2>/dev/null || echo "Nothing on 3000"
```

### Step 2: Start local environment

```bash
# This starts BOTH backend and frontend on correct ports
./start-local.sh
```

**Expected output:**
```
Backend:   ✅ Running on port 3081
Frontend:  ✅ Running on port 4000
MySQL:     ✅ Running
Jenkins:   ✅ Running on 4080
```

### Step 3: Run E2E tests

```bash
cd DBA-SOFTWARE
./run-e2e-tests.sh local

# Or manually:
npx playwright test
```

---

## 📊 Port Configuration

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend** | **4000** | http://localhost:4000 | React app for E2E |
| Backend | 3081 | http://localhost:3081/dba-alld | Spring Boot API |
| MySQL | 4306/3307 | localhost:4306 | Database |
| Jenkins | 4080 | http://localhost:4080/jenkins | CI/CD |
| Grafana | 4100 | http://localhost:4100 | Monitoring |

> **Note:** Frontend MUST run on port 4000 (not 3000) for E2E tests to work correctly.

---

## 🧪 Testing Workflow

### Option A: Automated (Recommended)

```bash
# Complete workflow: Build → Start → Test → Report
./local-e2e-workflow.sh
```

### Option B: Manual Step-by-Step

```bash
# 1. Start everything
./start-local.sh

# 2. Verify services
curl http://localhost:3081/actuator/health
curl http://localhost:4000

# 3. Run E2E tests
cd DBA-SOFTWARE
./run-e2e-tests.sh local

# 4. View report
npx playwright show-report
```

### Option C: Using Agents

```bash
# Let agents handle everything
./agents.sh all "Test application locally"

# Or step-by-step:
./agents.sh devops deploy local  # Deploy
./agents.sh qa run local         # Test
./agents.sh qa report            # Report
```

---

## 🛠️ Troubleshooting

### Frontend on port 3000 instead of 4000

**Problem:** `http://localhost:3000` is running but should be `4000`

**Solution:**
```bash
# Kill process on 3000
lsof -ti :3000 | xargs kill -9

# Start with correct port
cd DBA-SOFTWARE
PORT=4000 npm start
```

### Login failing

**Problem:** Login page shows but authentication fails

**Causes:**
1. Backend not running on 3081
2. Wrong API URL in frontend
3. Database not accessible

**Solution:**
```bash
# 1. Check backend
curl http://localhost:3081/actuator/health
# Should return: {"status":"UP"}

# 2. Check frontend .env
cd DBA-SOFTWARE
cat .env.local
# Should have: REACT_APP_API_URL=http://localhost:3081

# 3. Check database
docker ps | grep mysql
```

### Backend not starting

```bash
# Check if port 3081 is in use
lsof -i :3081

# Kill existing process
lsof -ti :3081 | xargs kill -9

# Rebuild backend
cd alld-backend
./mvnw clean package -DskipTests

# Restart
./start-local.sh
```

### E2E tests failing

```bash
# Run in debug mode
cd DBA-SOFTWARE
npx playwright test --debug

# Run specific test
npx playwright test --grep "Login"

# Check API connectivity first
curl http://localhost:3081/dba-alld/api/v1/members
```

---

## 📁 File Configuration

### Frontend `.env.local` (DBA-SOFTWARE/)

```env
REACT_APP_USE_MOCK_API=false
REACT_APP_API_BASE_URL=http://localhost:3081
REACT_APP_API_URL=http://localhost:3081
REACT_APP_RECAPTCHA_SITE_KEY=6LfsZn0sAAAAAIm6k23Fid0zAjtDBC77-rzdDlVu
```

### Backend `application-local.properties` (alld-backend/src/main/resources/)

```properties
spring.datasource.url=jdbc:mysql://localhost:3307/dba
spring.datasource.username=rwroot
spring.datasource.password=root
server.port=3081
```

---

## 🎯 E2E Test Examples

### Basic Health Check Test

```javascript
// tests/e2e/health-check.spec.js
const { test, expect } = require('@playwright/test');

test('Backend Health Check', async ({ request }) => {
  const response = await request.get('http://localhost:3081/actuator/health');
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe('UP');
});

test('Frontend Loads', async ({ page }) => {
  await page.goto('http://localhost:4000');
  await expect(page).toHaveTitle(/DBA/);
});
```

### Login Test

```javascript
// tests/e2e/login.spec.js
const { test, expect } = require('@playwright/test');

test('User Login', async ({ page }) => {
  await page.goto('http://localhost:4000/login');
  
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('http://localhost:4000/dashboard');
});
```

---

## 🔍 Verification Commands

```bash
# Check all services
./agents.sh devops health

# Backend health
curl http://localhost:3081/actuator/health

# Frontend responding
curl http://localhost:4000 | head -20

# Database accessible
docker exec mysql-db mysql -u rwroot -proot -e "SELECT 1;" dba

# View backend logs
tail -f alld-backend/backend-local.log

# View frontend logs
# Check terminal where npm start is running
```

---

## 📊 Test Report

After running E2E tests:

```bash
# View HTML report
cd DBA-SOFTWARE
npx playwright show-report

# Report location
open playwright-report/index.html
```

---

## 🛑 Stop Services

```bash
# Stop everything
./stop-local.sh

# Or manually:
lsof -ti :3000 | xargs kill -9 2>/dev/null
lsof -ti :4000 | xargs kill -9 2>/dev/null
docker stop dba-alld-local 2>/dev/null
```

---

## ✅ Checklist for E2E Testing

Before running E2E tests:

- [ ] Docker is running (`docker ps`)
- [ ] Backend healthy (`curl localhost:3081/actuator/health`)
- [ ] Frontend running on **4000** (`curl localhost:4000`)
- [ ] Database accessible (`docker ps | grep mysql`)
- [ ] No processes on port 3000 (kill if running)
- [ ] `.env.local` configured correctly

---

## 📞 Quick Reference

```bash
# Start everything
./start-local.sh

# Run E2E tests
cd DBA-SOFTWARE && ./run-e2e-tests.sh local

# View report
npx playwright show-report

# Stop everything
./stop-local.sh

# Health check
./agents.sh devops health
```

---

**Last Updated:** 2026-03-08
**Status:** ✅ Active
**Maintained By:** DevOps Team
