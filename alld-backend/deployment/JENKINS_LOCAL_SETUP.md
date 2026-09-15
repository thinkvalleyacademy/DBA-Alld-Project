# Local Jenkins Setup Guide for DBA ALLD Backend

## Overview

This guide walks you through setting up and configuring Jenkins locally to run the `Jenkinsfile.backend.local` pipeline for the DBA ALLD backend application.

---

## Prerequisites

### System Requirements
- **Linux/Mac/Windows (with WSL2)**: Jenkins host machine
- **Docker**: Installed and running (for containerized builds)
- **Docker Compose**: v2.0 or higher
- **Git**: For repository cloning
- **Java 21**: If running Maven locally (optional, Docker handles it)

### Verify Prerequisites
```bash
# Check Docker
docker --version
docker ps

# Check Docker Compose
docker compose version

# Check Git
git --version
```

---

## Step 1: Install & Start Jenkins

### Option A: Using Docker (Recommended)

```bash
# Create Jenkins volume for persistence
docker volume create jenkins-data

# Start Jenkins container
docker run -d \
  --name jenkins-local \
  -p 8081:8080 \
  -p 50000:50000 \
  -v jenkins-data:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(which docker):/usr/bin/docker \
  jenkins/jenkins:lts

# Get initial admin password
docker logs jenkins-local | grep -A 5 "Please use the following password"
```

Access Jenkins at: `http://localhost:8081`

### Option B: Local Installation (Linux/Mac)

```bash
# macOS
brew install jenkins-lts

# Linux (Ubuntu)
sudo apt-get install openjdk-17-jdk
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
sudo apt-get update
sudo apt-get install jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial password (Linux)
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Access Jenkins at: `http://localhost:8080`

---

## Step 2: Initial Jenkins Configuration

### 1. Unlock Jenkins
- Paste the admin password from the logs/file
- Click **Continue**

### 2. Install Recommended Plugins
- Select **Install Suggested Plugins**
- Wait for installation to complete (~10 minutes)

### 3. Create Admin User
- Create your admin account (e.g., `admin` / `localadmin`)
- Click **Save and Continue**

### 4. Configure Jenkins URL
- Set Jenkins URL to: `http://localhost:8081` (or `http://localhost:8080`)
- Click **Save and Finish**

---

## Step 3: Install Required Plugins

1. Go to **Manage Jenkins** → **Manage Plugins**
2. Search for and install these plugins:
   - **Docker Pipeline** - For Docker operations
   - **Pipeline** - For declarative pipelines
   - **Git** - For Git integration
   - **JUnit** - For test reporting
   - **Timestamper** - For timestamps in logs (optional)
   - **AnsiColor** - For colored output (optional)

3. Restart Jenkins after installation

---

## Step 4: Configure Jenkins User Permissions

1. Go to **Manage Jenkins** → **Configure Global Security**
2. Set **Authorization** to **Project-based Matrix Authorization Strategy**
3. Add your user with full permissions:
   - Check all boxes for your admin user
   - Click **Save**

---

## Step 5: Sync Backend Code Locally (No Git Auto-Checkout)

Since the `Jenkinsfile.backend.local` uses local code instead of automatic Git checkout, ensure your backend code is available to Jenkins:

### Option A: Direct Copy (Recommended for Development)
```bash
# Copy your backend code to the Jenkins workspace
cp -r /path/to/alld-backend /var/jenkins_home/workspace/code/alld-backend

# Or if using Docker Jenkins
docker exec jenkins-local bash -c "mkdir -p /var/jenkins_home/workspace/code && \
  cp -r /path/to/alld-backend /var/jenkins_home/workspace/code/"
```

### Option B: Symbolic Link
```bash
# Create a symbolic link to your development directory
mkdir -p /var/jenkins_home/workspace/code
ln -s /path/to/your/development/alld-backend /var/jenkins_home/workspace/code/alld-backend
```

### Option C: Manual Git Clone (One-time Setup)
```bash
# Clone the repo manually in Jenkins workspace
cd /var/jenkins_home/workspace/code
git clone https://github.com/your-org/alld-backend.git
cd alld-backend
git checkout dev  # or your branch
```

### Option D: Custom CODE_ROOT Location
Edit `Jenkinsfile.backend.local` and set `CODE_ROOT` to your actual code location:
```groovy
environment {
  CODE_ROOT = "/home/mukeshkumar/workspace/alld-backend"  // Point to your code
}
```

**Verification:** The Jenkinsfile will automatically verify that these files exist in CODE_ROOT:
- `pom.xml` - Maven project file
- `Dockerfile` - Docker build file
- `mvnw` - Maven wrapper executable

If any are missing, the `Verify Local Code` stage will fail with helpful instructions.

---

## Step 6: Create the Pipeline Job

### Create New Job

1. Click **New Item**
2. Enter Job Name: `DBA-ALLD-Backend-Local`
3. Select **Pipeline**
4. Click **OK**

### Configure Pipeline

1. **General** tab:
   - Check **This project is parameterized**
   - Click **Add Parameter** and define the same parameters as in the Jenkinsfile:
     - IMAGE_TAG (String)
     - RUN_TESTS (Boolean)
     - FORCE_BUILD (Boolean)
     - SKIP_TESTS_ON_ERROR (Boolean)
     - DEPLOYMENT_ACTION (Choice: deploy, rebuild, restart, logs, rollback)
     - CREATE_DB_BACKUP (Boolean)
     - BACKEND_PORT (String, default: 8080)
     - DB_PORT (String, default: 3306)
     - MYSQL_DATABASE (String, default: dba_dev)

2. **Pipeline** tab:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git** (optional - only if auto-pulling updates)
   - Repository URL: `https://github.com/your-repo/alld-backend.git` (leave blank if not auto-pulling)
   - Branch: `*/dev`
   - Script Path: `deployment/Jenkinsfile.backend.local`
   
   **OR** use **Pipeline script** and paste the Jenkinsfile content directly

3. Click **Save**

**Important Note:** The Jenkinsfile does NOT use Git checkout. It expects code in the workspace as configured in Step 5.

---

## Step 7: Configure Docker Socket Access (Important!)

### For Docker Jenkins Container

```bash
# Ensure Jenkins container can access Docker socket
docker exec jenkins-local chmod 666 /var/run/docker.sock
```

### For Local Jenkins

```bash
# Add jenkins user to docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

# Or (macOS)
# Run Jenkins with sudo or configure Docker to run without sudo
```

---

## Step 8: Prepare Local Code for Jenkins

The Jenkinsfile expects code to be available locally. Choose one approach:

### Approach 1: Copy Code to Jenkins Workspace
```bash
# Determine Jenkins workspace location
# - Docker: /var/jenkins_home/workspace
# - Local: /var/lib/jenkins/workspace (Linux) or ~/Jenkins/workspace (Mac)

# Create workspace directory
mkdir -p /var/jenkins_home/workspace/DBA-ALLD-Backend-Local

# Copy backend code
cp -r /path/to/alld-backend/* /var/jenkins_home/workspace/DBA-ALLD-Backend-Local/
```

### Approach 2: Use Symbolic Link (Recommended for Development)
```bash
# Link to your main development directory
ln -s /path/to/your/alld-backend /var/jenkins_home/workspace/DBA-ALLD-Backend-Local

# Verify
ls -la /var/jenkins_home/workspace/DBA-ALLD-Backend-Local/
# Should show: pom.xml, Dockerfile, mvnw, src/, deployment/, etc.
```

### Approach 3: Configure Custom CODE_ROOT in Jenkinsfile
Edit the Jenkinsfile and set the CODE_ROOT variable to point directly to your code:
```groovy
environment {
  CODE_ROOT = "/path/to/your/alld-backend"  // Your code location
}
```

---

## Step 9: Verify Requirements

Before running the pipeline, verify in Docker:

```bash
# Check if Docker network exists (Jenkinsfile creates it)
docker network ls | grep alld-local

# Check if docker-compose file exists
ls -la /path/to/alld-backend/deployment/docker-compose.backend.dev.yml

# Verify Maven wrapper
ls -la /path/to/alld-backend/mvnw
chmod +x /path/to/alld-backend/mvnw
```

---

## Step 10: Run the Pipeline

### First Run (with defaults)

1. Open job: **DBA-ALLD-Backend-Local**
2. Click **Build with Parameters**
3. Select parameters:
   - **DEPLOYMENT_ACTION**: `deploy`
   - **RUN_TESTS**: `true`
   - **CREATE_DB_BACKUP**: `true`
4. Click **Build**

### Monitor Build

- Click the **build number** to see details
- Scroll down to see **Console Output**
- Watch real-time logs

---

## Pipeline Actions

### 1. Deploy (Full Build & Deploy)
```
Parameters:
  - DEPLOYMENT_ACTION: deploy
  - RUN_TESTS: true
  - FORCE_BUILD: false
```
Compiles → Tests → Builds Docker image → Deploys → Health checks

### 2. Rebuild (Force Rebuild Database)
```
Parameters:
  - DEPLOYMENT_ACTION: rebuild
  - FORCE_BUILD: true
  - CREATE_DB_BACKUP: true
```
Same as deploy but recreates database container

### 3. Restart (Quick Restart)
```
Parameters:
  - DEPLOYMENT_ACTION: restart
```
Just restarts the backend container (no build)

### 4. Logs (View Live Logs)
```
Parameters:
  - DEPLOYMENT_ACTION: logs
```
Shows the last 50 lines of backend logs

### 5. Rollback (Go to Previous Version)
```
Parameters:
  - DEPLOYMENT_ACTION: rollback
```
Stops current deployment and starts previous Docker image

---

## Environment Variables & Secrets

### .env File Creation

The pipeline creates `.env` automatically in `${DEPLOY_ROOT}/.env`, but you can customize:

```bash
# Manual .env creation (if needed)
cat > ~/dist/.env <<EOF
BACKEND_IMAGE=localhost/alld/backend:latest
BACKEND_PORT=8080
BACKEND_ENVIRONMENT=local

DB_CONTAINER_NAME=alld-db-local
MYSQL_ROOT_PASSWORD=root_password_local
MYSQL_DATABASE=dba_dev
MYSQL_USER=alld_user
MYSQL_PASSWORD=alld_password_local
DB_PORT=3306

JAVA_OPTS=-Xmx1024m -Xms512m
TZ=Asia/Kolkata

JWT_SECRET=local_jwt_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=dba-alld-local

LOG_LEVEL=INFO
DOCKER_NETWORK=alld-local
EOF
```

### Add Credentials in Jenkins (Optional)

If using external credentials:

1. **Manage Jenkins** → **Manage Credentials**
2. Click **Add Credentials**
3. Select **Secret text** for each:
   - MYSQL_ROOT_PASSWORD
   - MYSQL_APP_PASSWORD
   - JWT_SECRET
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY

---

## Docker Compose Configuration Checklist

Ensure `deployment/docker-compose.backend.dev.yml` includes:

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: alld-db-local
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "${DB_PORT}:3306"
    networks:
      - ${DOCKER_NETWORK}
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ${BACKEND_IMAGE}
    container_name: alld-backend-local
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://db:3306/${MYSQL_DATABASE}
      SPRING_DATASOURCE_USERNAME: ${MYSQL_USER}
      SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD}
      JAVA_OPTS: ${JAVA_OPTS}
    ports:
      - "${BACKEND_PORT}:8080"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - ${DOCKER_NETWORK}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/dba-alld/actuator/health"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  alld-local:
    driver: bridge
```

---

## Troubleshooting

### Problem: "Docker daemon not running"
```bash
# Start Docker
docker daemon  # or use Docker Desktop GUI
```

### Problem: "Docker socket permission denied"
```bash
# Fix permissions
sudo chmod 666 /var/run/docker.sock
```

### Problem: "Cannot connect to repository"
```bash
# Verify Git credentials in Jenkins
# Go to Manage Credentials and update GitHub SSH key
```

### Problem: "Port already in use"
```bash
# Find and kill process using port
lsof -i :8080
kill -9 <PID>

# Or change BACKEND_PORT parameter
```

### Problem: "Build succeeds but container won't start"
```bash
# Check Docker logs
docker logs alld-backend-local

# Check environment variables
docker exec alld-backend-local env | grep -i mysql

# Verify health check
docker inspect alld-backend-local | grep -A 5 Health
```

### Problem: "Tests fail but deployment succeeds"
```bash
# Check if SKIP_TESTS_ON_ERROR=true is set
# Review test logs in Jenkins console

# Run tests manually
./mvnw test
./mvnw test -Dtest=ReCaptchaServiceTest
```

---

## Useful Commands

### Monitor Pipeline Execution
```bash
# Watch Docker containers
docker ps -w

# Follow backend logs
docker logs -f alld-backend-local

# View all pipeline logs
tail -f ${JENKINS_HOME}/logs/jenkins.log
```

### Manual Docker Operations
```bash
# List images
docker images | grep alld

# Stop backend
docker stop alld-backend-local

# Restart backend
docker restart alld-backend-local

# Full cleanup
docker compose -f ~/dist/docker-compose.backend.dev.yml down -v
```

### Jenkins Management
```bash
# Docker Jenkins container
docker exec jenkins-local bash  # Access shell

# View Jenkins logs
docker logs -f jenkins-local

# Backup Jenkins home
docker exec jenkins-local tar -czf /var/jenkins_home/backup.tar.gz /var/jenkins_home
```

---

## Next Steps

1. ✅ Run your first build
2. ✅ Verify backend is running: `curl http://localhost:8080/dba-alld/actuator/health`
3. ✅ Check logs: Go to Jenkins job → Build → Console Output
4. ✅ Set up additional jobs for Frontend/Monitoring (similar pipeline)
5. ✅ Configure build triggers (automatic on Git push)

---

## Build Triggers (Optional)

### Poll SCM
1. Go to job configuration
2. **Build Triggers** tab
3. Check **Poll SCM**
4. Schedule: `H/15 * * * *` (every 15 minutes)

### GitHub Webhook
1. Add webhook to GitHub repo: `http://YOUR_JENKINS_URL/github-webhook/`
2. Content type: `application/json`
3. Trigger on: Push events
4. Jenkins will auto-trigger on git push

---

## Support & Resources

- **Jenkins Documentation**: https://www.jenkins.io/doc/
- **Docker Documentation**: https://docs.docker.com/
- **Spring Boot Health Check**: https://spring.io/guides/gs/actuator-service/
- **MySQL Docker**: https://hub.docker.com/_/mysql

---

## Summary

You now have:
- ✅ Jenkins running locally
- ✅ DBA ALLD Backend pipeline configured
- ✅ Docker builds & deployments automated
- ✅ Database backup before deployment
- ✅ Health checks & verification
- ✅ Rollback capability

**Start building and deploying! 🚀**
