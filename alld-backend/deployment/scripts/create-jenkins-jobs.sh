#!/bin/bash
# ================================================================
# DBA ALLD - Jenkins Job Creator
# Automatically creates Jenkins pipeline jobs from Jenkinsfiles
# ================================================================
# Usage: ./create-jenkins-jobs.sh
# ================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
JENKINS_URL="http://localhost:8080/jenkins"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} ${GREEN}[INFO]${NC} $@"
}

error() {
    echo -e "${RED}[ERROR]${NC} $@"
}

# Get Jenkins admin password
get_jenkins_password() {
    local PASSWORD_FILE="$PROJECT_ROOT/local-setup/jenkins/secrets/initialAdminPassword"
    if [ -f "$PASSWORD_FILE" ]; then
        cat "$PASSWORD_FILE"
    else
        echo ""
    fi
}

# Create Jenkins job using CLI
create_jenkins_job() {
    local JOB_NAME=$1
    local JOB_TYPE=$2
    local JENKINSFILE_PATH=$3
    
    log "Creating Jenkins job: $JOB_NAME"
    
    # Create job XML configuration
    local XML_CONFIG=$(cat << EOF
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <description>Automated job for $JOB_NAME</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <hudson.model.ParametersDefinitionProperty>
      <parameterDefinitions>
        <hudson.model.ChoiceParameterDefinition>
          <name>ENVIRONMENT</name>
          <description>Select target environment</description>
          <choices class="java.util.Arrays.asList">
            <string class="string">dev</string>
            <string class="string">local</string>
          </choices>
        </hudson.model.ChoiceParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>CREATE_BACKUP</name>
          <description>Create database backup before migration</description>
          <defaultValue>true</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>VERIFY_MIGRATION</name>
          <description>Verify migration after completion</description>
          <defaultValue>true</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>DRY_RUN</name>
          <description>Run in dry-run mode (no actual changes)</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
      </parameterDefinitions>
    </hudson.model.ParametersDefinitionProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps">
    <scm class="hudson.plugins.git.GitSCM" plugin="git">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>file://$PROJECT_ROOT</url>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/main</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
      <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
      <submoduleCfg class="empty-list"/>
      <extensions/>
    </scm>
    <scriptPath>$JENKINSFILE_PATH</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <disabled>false</disabled>
</flow-definition>
EOF
)
    
    # Create job using curl
    local JENKINS_PASSWORD=$(get_jenkins_password)
    
    if [ -z "$JENKINS_PASSWORD" ]; then
        error "Jenkins password not found. Please complete Jenkins setup first."
        return 1
    fi
    
    # Create job
    curl -X POST "$JENKINS_URL/createItem" \
        --user "admin:$JENKINS_PASSWORD" \
        --header "Content-Type: text/xml" \
        --data "$XML_CONFIG" \
        --write-out "\nHTTP Status: %{http_code}\n" \
        --silent \
        -o /dev/null || {
            error "Failed to create job $JOB_NAME"
            return 1
        }
    
    log "Job $JOB_NAME created successfully ✓"
}

# Main function
main() {
    echo "=========================================="
    echo "DBA ALLD - Jenkins Job Creator"
    echo "=========================================="
    echo ""
    
    # Check if Jenkins is running
    if ! curl -s "$JENKINS_URL" > /dev/null; then
        error "Jenkins is not accessible at $JENKINS_URL"
        echo "Make sure Jenkins is running: docker ps | grep jenkins"
        exit 1
    fi
    
    log "Jenkins is accessible at $JENKINS_URL ✓"
    
    # Create jobs
    create_jenkins_job "DB-Migration-Dev" "pipeline" "deployment/Jenkinsfile.db-migration.dev"
    create_jenkins_job "DB-Migration-Prod" "pipeline" "deployment/Jenkinsfile.db-migration.prod"
    create_jenkins_job "DB-Backup-Automated" "pipeline" "deployment/Jenkinsfile.db-backup"
    create_jenkins_job "DB-Restore-Rollback" "pipeline" "deployment/Jenkinsfile.db-restore"
    
    echo ""
    echo "=========================================="
    echo "Jenkins Jobs Created Successfully!"
    echo "=========================================="
    echo ""
    echo "Available Jobs:"
    echo "  - DB-Migration-Dev"
    echo "  - DB-Migration-Prod"
    echo "  - DB-Backup-Automated"
    echo "  - DB-Restore-Rollback"
    echo ""
    echo "Access Jenkins: $JENKINS_URL"
    echo ""
}

main "$@"
