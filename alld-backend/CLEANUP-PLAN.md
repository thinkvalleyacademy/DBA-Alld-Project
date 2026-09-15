# Repository Cleanup Plan

## 🎯 Goal
Keep only files related to:
- ✅ **Source Code** (`src/`)
- ✅ **Deployment** (`deployment/`)
- ✅ **Monitoring** (`deployment/monitoring/`)
- ✅ **Build Configuration** (`pom.xml`, `Dockerfile`, `.mvn/`)
- ✅ **Essential Documentation** (`README.md`)

---

## 📁 Files to KEEP

### Core Application
```
src/                          # Source code (KEEP)
pom.xml                       # Maven build config (KEEP)
Dockerfile                    # Docker build config (KEEP)
.mvn/                         # Maven wrapper (KEEP)
mvnw, mvnw.cmd               # Maven wrapper scripts (KEEP)
.gitignore                    # Git ignore rules (KEEP)
.gitattributes                # Git attributes (KEEP)
```

### Deployment & Monitoring
```
deployment/                   # ALL deployment configs (KEEP)
├── docker-compose.backend.dev.yml
├── docker-compose.backend.prod.yml
├── docker-compose.monitoring.dev.yml
├── docker-compose.monitoring.prod.yml
├── Jenkinsfile.backend.dev
├── Jenkinsfile.backend.dev.enhanced
├── Jenkinsfile.backend.prod
├── Jenkinsfile.monitoring.dev
├── Jenkinsfile.monitoring.prod
├── MONITORING-SETUP.md
├── DEV-PROD-PARITY.md
└── monitoring/
    ├── dev/
    └── prod/
```

### Environment Files
```
.env.example                  # Template (KEEP)
.env.dev                      # DEV config (KEEP - for Jenkins)
.env.prod                     # PROD config (KEEP - for Jenkins)
```

### Essential Docs
```
README.md                     # Main documentation (KEEP)
```

---

## 🗑️ Files to REMOVE

### Temporary/Log Files
```
backend-logs/                 # Log files (REMOVE)
output/                       # Generated output files (REMOVE)
test-dev.logs                 # Test logs (REMOVE)
*.log                         # All log files (REMOVE)
```

### Old Documentation (in root)
```
BACKEND-RESTARTED.md          # Temporary notes (REMOVE)
LOGOUT-IMPLEMENTATION.md      # Implementation notes (REMOVE)
MONITORING-QUICKSTART.md      # Old monitoring doc (REMOVE - replaced by deployment/MONITORING-SETUP.md)
PORT-ALLOCATION.md            # Old port docs (REMOVE)
PORTS-QUICK-REFERENCE.md      # Old port docs (REMOVE)
PORTS.md                      # Old port docs (REMOVE)
SMOKE-TEST-REPORT.md          # Test report (REMOVE)
```

### Old Setup Scripts
```
LOCAL-SETUP.md                # Old local setup (REMOVE)
restart-backend.sh            # Manual script (REMOVE)
start-all.sh                  # Manual script (REMOVE)
stop-all.sh                   # Manual script (REMOVE)
```

### Test/Dev Files
```
dev-fixes/                    # Temporary dev folder (REMOVE if empty)
test-smoke-welfare.sh         # Old test script (REMOVE)
keystore.p12                  # SSL cert (REMOVE - should be in secrets)
```

### Documentation Duplicates
```
docs/                         # Old docs folder (REMOVE/MERGE)
├── API_FUNCTIONALITY.md
├── CODE-FIXES-SUMMARY.md
├── DATABASE-MIGRATION-GUIDE.md
├── DATABASE-QUICKSTART.md
├── DATABASE-UPGRADE-SUMMARY.md
├── JENKINS-IMPLEMENTATION-SUMMARY.md
├── JENKINS-MIGRATION-GUIDE.md
├── LOCAL-SETUP-COMPLETE.md
├── PERFORMANCE-IMPLEMENTATION-SUMMARY.md
├── PERFORMANCE-OPTIMIZATION-JAVA25.md
├── PORT-ALLOCATION-COMPLETE.md
├── PORT-ALLOCATION-SUMMARY.md
├── QUICK-REFERENCE.md
├── RELEASE_NOTES.md
├── SETUP-SUCCESS.md
├── TESTING-SUMMARY.md
└── WELFARE-LIST-OPTIMIZATION.md

hosting/                      # Old hosting docs (REMOVE)
└── README.hosting.md

local-setup/                  # Empty folder (REMOVE)
```

### Config Files (Not Needed)
```
config/                       # JVM config (REMOVE - use Docker config)
└── jvm.config

database/                     # Local DB files (REMOVE)
├── backups/
└── migrations/

assets/                       # Assets (REMOVE unless used by app)
└── img/
```

### Environment Files (Local Only)
```
.env                          # Local env (REMOVE - should be in secrets)
.env.local                    # Local env (REMOVE)
```

---

## 📋 Cleanup Commands

### Run on Local Machine (NOT on server!)

```bash
cd /Users/mukeshkumar/Desktop/TVA-application-devlopment/dba_alld_devlopment/dba-running-repos/alld-backend

# Remove log files
rm -rf backend-logs/
rm -f *.log
rm -f test-dev.logs

# Remove old documentation
rm -f BACKEND-RESTARTED.md
rm -f LOGOUT-IMPLEMENTATION.md
rm -f MONITORING-QUICKSTART.md
rm -f PORT-ALLOCATION.md
rm -f PORTS-QUICK-REFERENCE.md
rm -f PORTS.md
rm -f SMOKE-TEST-REPORT.md
rm -f LOCAL-SETUP.md

# Remove old scripts
rm -f restart-backend.sh
rm -f start-all.sh
rm -f stop-all.sh
rm -f test-smoke-welfare.sh

# Remove temporary files
rm -f keystore.p12
rm -rf output/
rm -rf dev-fixes/

# Remove old documentation folders
rm -rf docs/
rm -rf hosting/
rm -rf local-setup/
rm -rf config/
rm -rf database/
rm -rf assets/

# Remove local environment files (keep .example)
rm -f .env
rm -f .env.local
```

---

## ✅ Final Structure

After cleanup, the repository should look like:

```
alld-backend/
├── src/                          # Source code
├── deployment/                   # Deployment & Monitoring
│   ├── docker-compose.*.yml
│   ├── Jenkinsfile.*
│   ├── MONITORING-SETUP.md
│   ├── DEV-PROD-PARITY.md
│   └── monitoring/
│       ├── dev/
│       └── prod/
├── .mvn/                         # Maven wrapper
├── .env.example                  # Environment template
├── .env.dev                      # DEV config
├── .env.prod                     # PROD config
├── .gitignore
├── .gitattributes
├── Dockerfile
├── mvnw
├── mvnw.cmd
├── pom.xml
└── README.md
```

---

## 🚀 After Cleanup

1. **Commit the cleanup:**
   ```bash
   git add -A
   git commit -m "Cleanup: Remove unnecessary files, keep only code/deployment/monitoring"
   git push origin dev
   ```

2. **Verify on server:**
   - Deployment still works
   - Monitoring still works
   - Jenkins pipelines still work

---

**Last Updated:** 2026-03-22
**Action Required:** Review and approve before running cleanup commands
