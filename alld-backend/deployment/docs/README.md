# 📚 Deployment Documentation Index

**Complete guide to deploying DBA ALLD application**

---

## 🚀 Quick Start

### **Local Deployment** (Testing)
```bash
cd deployment/agents
./start-local.sh
```

### **Dev Deployment** (Production-like)
```bash
# Via Jenkins
http://localhost:4080/jenkins/job/dba-alld-deploy/

# Or via script
cd deployment/scripts
./deploy-backend.sh dev
```

### **Prod Deployment** (Production)
```bash
# Via Jenkins (requires approval)
http://localhost:4080/jenkins/job/dba-alld-deploy/
```

---

## 📖 Documentation by Category

### **Getting Started**
- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Complete deployment guide
- [LOCAL-TESTING-QUICKSTART.md](LOCAL-TESTING-QUICKSTART.md) - Quick start for local testing
- [PUSH-TO-DEV.md](PUSH-TO-DEV.md) - Push to dev branch guide

### **Environment-Specific Guides**
- [LOCAL-DEPLOYMENT.md](LOCAL-DEPLOYMENT.md) - Local environment setup
- [DEV-DEPLOYMENT.md](DEV-DEPLOYMENT.md) - Dev environment deployment
- [PROD-DEPLOYMENT.md](PROD-DEPLOYMENT.md) - Prod environment deployment
- [README.dev-deploy.md](README.dev-deploy.md) - Existing dev guide
- [README.prod-deploy.md](README.prod-deploy.md) - Existing prod guide

### **Jenkins & CI/CD**
- [JENKINS-SETUP.md](JENKINS-SETUP.md) - Jenkins configuration
- [JENKINS-DEPLOYMENT.md](JENKINS-DEPLOYMENT.md) - Jenkins deployment guide
- [JENKINS-PIPELINE-READY.md](JENKINS-PIPELINE-READY.md) - Pipeline setup

### **Multi-Agent System**
- [AGENT-SETUP.md](AGENT-SETUP.md) - Agent configuration
- [AGENTS.md](../../AGENTS.md) - Multi-agent documentation

### **Advanced Topics**
- [SEPARATE-DEPLOYMENT.md](SEPARATE-DEPLOYMENT.md) - Separate frontend/backend deployment
- [USING-EXISTING-DEPLOYMENT.md](USING-EXISTING-DEPLOYMENT.md) - Using existing infrastructure
- [LOCAL-DEPLOYMENT-TEST-RESULT.md](LOCAL-DEPLOYMENT-TEST-RESULT.md) - Local test results

### **Monitoring**
- [README.monitoring.md](README.monitoring.md) - Monitoring setup

---

## 📁 Directory Structure

```
deployment/
├── README.md                        # This overview
├── .gitignore                       # Git ignore rules
├── docs/                            # Documentation
│   ├── DEPLOYMENT-GUIDE.md
│   ├── LOCAL-DEPLOYMENT.md
│   ├── DEV-DEPLOYMENT.md
│   ├── PROD-DEPLOYMENT.md
│   ├── JENKINS-SETUP.md
│   ├── AGENT-SETUP.md
│   └── ...
├── agents/                          # Agent scripts
│   ├── agents.sh                    # Multi-agent orchestration
│   ├── jenkins-deploy.sh            # Jenkins deployment
│   ├── start-local.sh               # Local startup
│   └── stop-local.sh                # Local shutdown
├── scripts/                         # Deployment scripts
│   ├── deploy-backend.sh            # Backend deployment
│   ├── deploy-frontend.sh           # Frontend deployment
│   ├── backup-database.sh           # DB backup
│   └── migrate-database.sh          # DB migration
├── Jenkinsfile*                     # Jenkins pipelines
├── docker-compose*.yml              # Docker Compose files
└── .env.*                           # Environment files
```

---

## 🎯 Common Tasks

### **Start Local Environment**
```bash
cd deployment/agents
./start-local.sh
```

### **Run E2E Tests**
```bash
cd deployment/agents
./local-e2e-workflow.sh
```

### **Deploy to Dev**
```bash
cd deployment/scripts
./deploy-backend.sh dev
```

### **Backup Database**
```bash
cd deployment/scripts
./backup-database.sh dev
```

### **View Logs**
```bash
# Backend logs
tail -f /var/log/dba-alld/backend.log

# Jenkins logs
docker logs jenkins-master -f

# Docker Compose logs
cd deployment
docker-compose logs -f
```

---

## 🔧 Troubleshooting

### **Backend Won't Start**
- Check logs: `tail -f backend-deploy.log`
- Check ports: `lsof -i :3081`
- Check database: `docker ps | grep mysql`

### **Frontend Won't Start**
- Check logs: `tail -f frontend-deploy.log`
- Check ports: `lsof -i :4000`
- Check Node.js: `node --version`

### **Jenkins Build Fails**
- Check console: `http://localhost:4080/jenkins/job/dba-alld-deploy/lastBuild/console`
- Check credentials: Jenkins > Manage Jenkins > Credentials
- Check workspace: Jenkins > Workspace

---

## 📞 Support

- **Jenkins:** http://localhost:4080/jenkins
- **Grafana:** http://localhost:4100
- **Prometheus:** http://localhost:4190
- **phpMyAdmin:** http://localhost:4082

---

**Last Updated:** 2026-03-08  
**Maintained By:** DevOps Team  
**Status:** ✅ Active
