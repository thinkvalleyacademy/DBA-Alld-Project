# Deployment Directory Structure

**All deployment-related files, scripts, Jenkins pipelines, and documentation**

---

## 📁 Directory Organization

```
deployment/
├── README.md                        # This file - Deployment overview
├── .gitignore                       # Ignore runtime files
│
├── # ===============================
├── # JENKINS PIPELINES
├── # ===============================
├── Jenkinsfile                      # Main pipeline (local/dev/prod)
├── Jenkinsfile.backend.dev          # Dev backend pipeline
├── Jenkinsfile.backend.prod         # Prod backend pipeline
├── Jenkinsfile.frontend.dev         # Dev frontend pipeline (NEW)
├── Jenkinsfile.frontend.prod        # Prod frontend pipeline (NEW)
├── Jenkinsfile.db-backup.dev        # Dev DB backup
├── Jenkinsfile.db-backup.prod       # Prod DB backup
├── Jenkinsfile.db-migration.dev     # Dev DB migration
├── Jenkinsfile.db-migration.prod    # Prod DB migration
├── Jenkinsfile.db-restore           # DB restore
├── Jenkinsfile.monitoring           # Monitoring setup
├── Jenkinsfile.create-release-branch # Release management
│
├── # ===============================
├── # DOCKER COMPOSE FILES
├── # ===============================
├── docker-compose.backend.yml       # Generic backend compose
├── docker-compose.backend.dev.yml   # Dev backend deployment
├── docker-compose.backend.prod.yml  # Prod backend deployment
├── docker-compose.frontend.yml      # Generic frontend compose
├── docker-compose.frontend.dev.yml  # Dev frontend deployment (NEW)
├── docker-compose.frontend.prod.yml # Prod frontend deployment (NEW)
├── docker-compose.jenkins.yml       # Jenkins setup
├── docker-compose.monitoring.yml    # Monitoring stack
├── docker-compose.local.yml         # Local complete setup
│
├── # ===============================
├── # DEPLOYMENT SCRIPTS
├── # ===============================
├── scripts/
│   ├── deploy-backend.sh            # Backend deployment script
│   ├── deploy-frontend.sh           # Frontend deployment script
│   ├── deploy-local.sh              # Local deployment (NEW)
│   ├── backup-database.sh           # DB backup
│   ├── backup_db.sh                 # Alternative DB backup
│   ├── restore_db.sh                # DB restore
│   ├── list_backups.sh              # List backups
│   ├── migrate-database.sh          # DB migration
│   ├── cleanup-old-setup.sh         # Cleanup script
│   └── setup-local-complete.sh      # Local setup complete
│
├── # ===============================
├── # AGENT SCRIPTS
├── # ===============================
├── agents/
│   ├── agents.sh                    # Multi-agent orchestration (NEW)
│   ├── jenkins-deploy.sh            # Jenkins deployment agent (NEW)
│   ├── update-jenkins-job.sh        # Jenkins job updater (NEW)
│   ├── start-local.sh               # Local environment starter (NEW)
│   ├── stop-local.sh                # Local environment stopper (NEW)
│   └── local-e2e-workflow.sh        # Local E2E workflow (NEW)
│
├── # ===============================
├── # ENVIRONMENT FILES
├── # ===============================
├── .env.local                       # Local environment variables
├── .env.dev                         # Dev environment variables
├── .env.prod                        # Prod environment variables
├── .env.dev.example                 # Dev template
├── .env.prod.example                # Prod template
│
├── # ===============================
├── # DOCUMENTATION
├── # ===============================
├── docs/
│   ├── README.md                    # Documentation index
│   ├── DEPLOYMENT-GUIDE.md          # Complete deployment guide
│   ├── LOCAL-DEPLOYMENT.md          # Local deployment guide
│   ├── DEV-DEPLOYMENT.md            # Dev deployment guide
│   ├── PROD-DEPLOYMENT.md           # Prod deployment guide
│   ├── JENKINS-SETUP.md             # Jenkins configuration
│   ├── AGENT-SETUP.md               # Agent configuration
│   ├── SEPARATE-DEPLOYMENT.md       # Separate frontend/backend (NEW)
│   ├── USING-EXISTING-DEPLOYMENT.md # Using existing infra (NEW)
│   ├── LOCAL-TEST-RESULTS.md        # Local test results (NEW)
│   ├── README.dev-deploy.md         # Existing dev guide
│   ├── README.prod-deploy.md        # Existing prod guide
│   └── README.monitoring.md         # Monitoring guide
│
├── # ===============================
├── # SUBDIRECTORIES
├── # ===============================
├── local-setup/                     # Local environment setup
├── jenkins/                         # Jenkins configuration
├── monitoring/                      # Monitoring stack
├── docker/                          # Docker files
├── database/                        # Database scripts
└── scripts/                         # Deployment scripts
```

---

## 🎯 What Belongs Here

### **✅ Include in Git:**
- Jenkinsfiles (all pipelines)
- Docker Compose files
- Deployment scripts (.sh)
- Agent scripts (.sh)
- Environment templates (.env.example)
- Documentation (.md)
- Configuration files (.yml, .xml)

### **❌ Exclude from Git (.gitignore):**
- Jenkins runtime data (`local-setup/jenkins/**`)
- MySQL data files (`local-setup/mysql/data/**`)
- Log files (`*.log`)
- Build artifacts (`target/`, `build/`)
- Node modules (`node_modules/`)
- Environment secrets (`.env` without .example)
- Runtime state files

---

## 🚀 Usage

### **Local Deployment**
```bash
cd deployment
./agents/start-local.sh
```

### **Dev Deployment**
```bash
# Via Jenkins
http://localhost:4080/jenkins/job/dba-alld-deploy/

# Or via script
./scripts/deploy-backend.sh dev
```

### **Prod Deployment**
```bash
# Via Jenkins (requires approval)
http://localhost:4080/jenkins/job/dba-alld-deploy/
```

---

## 📖 Documentation

- **Getting Started:** `docs/DEPLOYMENT-GUIDE.md`
- **Local Setup:** `docs/LOCAL-DEPLOYMENT.md`
- **Jenkins Setup:** `docs/JENKINS-SETUP.md`
- **Agent Setup:** `docs/AGENT-SETUP.md`

---

**Maintained By:** DevOps Team  
**Last Updated:** 2026-03-08  
**Status:** ✅ Active
