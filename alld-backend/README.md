# alld-backend
Swagger: 
http://localhost:8081/dba-alld/swagger-ui/index.html

API functionality documentation:
`docs/API_FUNCTIONALITY.md`


# How to upload files to S3 bucket

curl -X POST http://localhost:8081/dba-alld/files/bulk-upload \
$(for f in /Users/mukeshkumar/Downloads/upload/photos/*; do echo -n "-F files=@$f "; done) \
-F "folder=photos"


one by one upload

//source: /Users/mukeshkumar/Downloads/upload/photos/*
//destination - s3://amazn-s3-dbaalld/photos/

//source: /Users/mukeshkumar/Downloads/upload/affidavit/*
//destination - s3://amazn-s3-dbaalld/affidavit/


from terminal:

for f in /Users/mukeshkumar/Downloads/upload/photos/*; do
curl -X POST http://localhost:8081/dba-alld/files/bulk-upload \
-F "files=@$f" \
-F "folder=photos"
done

Photos;
ls /Users/mukeshkumar/Downloads/upload/photos | \
xargs -n 100 -I {} sh -c '
curl -X POST http://localhost:8081/dba-alld/files/bulk-upload \
-F "files=@/Users/mukeshkumar/Downloads/upload/photos/{}" \
-F "folder=photos"
'

affidavit;
ls /Users/mukeshkumar/Downloads/upload/photos | \
xargs -n 50 -I {} sh -c '
curl -X POST http://localhost:8081/dba-alld/files/bulk-upload \
-F "files=@/Users/mukeshkumar/Downloads/upload/affidavit/{}" \
-F "folder=affidavit"
'


---

via aws cli

aws s3 cp photos \
s3://amazn-s3-dbaalld/photos/ \
--recursive \
--only-show-errors


aws s3 cp /Users/mukeshkumar/Downloads/upload/affidavit \
s3://amazn-s3-dbaalld/affidavit/ \
--recursive \
--only-show-errors


aws s3 cp /Users/mukeshkumar/Downloads/upload/bc_of_up_photo \
s3://amazn-s3-dbaalld/bc_of_up_photo/ \
--recursive \
--only-show-errors

aws s3 cp /Users/mukeshkumar/Downloads/upload/qrcode \
s3://amazn-s3-dbaalld/qrcode/ \
--recursive \
--only-show-errors


aws s3 ls s3://amazn-s3-dbaalld/photos/ --recursive --human-readable --summarize

dev
mysql -h 127.0.0.1 -P 5306 -u rwroot -p

preprod
mysql -h 127.0.0.1 -P 6306 -u rwroot -p

prod


docker compose --env-file .env down --remove-orphans


cd /Users/mukeshkumar/Downloads/upload

find . -type f -newermt "2026-02-22" -print0 | \
while IFS= read -r -d '' file; do
echo "Uploading: $file"
aws s3 cp "$file" "s3://amazn-s3-dbaalld/${file#./}"
done


run in local
# Frontend
cd /Users/mukeshkumar/Desktop/TVA-application-devlopment/dba_alld_devlopment/dba-running-repos/DBA-SOFTWARE
npm install
npm start

# Backend
cd /Users/mukeshkumar/Desktop/TVA-application-devlopment/dba_alld_devlopment/dba-running-repos/alld-backend
cp .env.example .env
# edit .env and set real JWT_SECRET at minimum
./mvnw spring-boot:run -Dspring-boot.run.profiles=local_mac

./mvnw spring-boot:run -Dspring-boot.run.profiles=local_mac



mukeshkumar@mukeshs-MacBook-Pro alld-backend % ./start-all.sh


============================================
DBA ALLD Self-Healing Monitoring System
============================================

[SUCCESS] Docker is running ✓
[SUCCESS] Python is installed ✓

[INFO] Step 1: Starting Monitoring Stack (Prometheus, Grafana, Alertmanager)...

[INFO] Starting essential monitoring services...
[INFO] Starting Prometheus, Grafana, and Alertmanager...
[+] up 2/2
✔ Container dba-prometheus Running                                                                                                                                     0.0s
✔ Container dba-grafana    Running                                                                                                                                     0.0s
[INFO] Waiting for services to start (this may take 30 seconds)...
[INFO] Checking service status...
NAME               IMAGE                       COMMAND                  SERVICE        CREATED          STATUS                          PORTS
dba-alertmanager   prom/alertmanager:v0.26.0   "/bin/alertmanager -…"   alertmanager   9 minutes ago    Restarting (1) 40 seconds ago   
dba-grafana        grafana/grafana:10.2.0      "/run.sh"                grafana        29 minutes ago   Up 29 minutes                   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
dba-prometheus     prom/prometheus:v2.48.0     "/bin/prometheus --c…"   prometheus     29 minutes ago   Up 29 minutes                   0.0.0.0:9090->9090/tcp, [::]:9090->9090/tcp

[SUCCESS] Monitoring stack started!

============================================
Access URLs:
============================================
Grafana:      http://localhost:3000
Username: admin
Password: admin123

Prometheus:   http://localhost:9090
Alertmanager: http://localhost:9093
============================================

[INFO] To view logs: docker compose -f docker-compose.local.yml logs -f <service-name>
[INFO] To stop: docker compose -f docker-compose.local.yml down

[INFO] Step 2: Checking Python dependencies...
[SUCCESS] Python dependencies already installed ✓

[INFO] Step 3: Starting Self-Healing Python Services...

[INFO] Found Python 3.9.6
[INFO] Starting Self-Healing Python Services...

[WARN] anomaly-detector is already running (PID: 63545)
[WARN] alert-manager is already running (PID: 63553)
[INFO] Starting log-analyzer...
[SUCCESS] log-analyzer started (PID: 64394)
[INFO] Logs: tail -f /Users/mukeshkumar/dba-alld-logs/self-healing/log-analyzer.log
[INFO] Starting Self-Healing Orchestrator...
[ERROR] Failed to start Orchestrator

[SUCCESS] All self-healing services started!

============================================
Service Status:
============================================
✓ anomaly-detector: Running (PID: 63545)
✓ alert-manager: Running (PID: 63553)
✓ log-analyzer: Running (PID: 64394)
✗ orchestrator: Stopped

============================================
API Endpoints:
============================================
Alert Manager:  http://localhost:8082 - not running 
Health Check:   http://localhost:8082/health
Active Alerts:  http://localhost:8082/api/v1/alerts/active
============================================


============================================
System Started Successfully!
============================================

📊 Monitoring Dashboards:
─────────────────────────────────────────
Grafana:      http://localhost:3000
Username: admin
Password: admin123

Prometheus:   http://localhost:9090
Alertmanager: http://localhost:9093 not running 
cAdvisor:     http://localhost:8080

🤖 Self-Healing Services:
─────────────────────────────────────────
Alert Manager API: http://localhost:8082
Health Check:      http://localhost:8082/health
Active Alerts:     http://localhost:8082/api/v1/alerts/active

📝 Useful Commands:
─────────────────────────────────────────
View logs:  ./start-self-healing.sh logs
Status:     ./start-self-healing.sh status
Stop all:   ./stop-all.sh

📚 Documentation:
─────────────────────────────────────────
Local Setup:  LOCAL-SETUP.md
Quick Start:  self-healing/QUICKSTART.md
Runbooks:     self-healing/docs/runbooks/
============================================

[INFO] Checking if backend is accessible...
[WARN] Backend application not detected on port 8081
[INFO] Make sure your Spring Boot application is running on port 8081
[INFO] Prometheus will scrape metrics once the application is available

[SUCCESS] Setup complete! Open Grafana at http://localhost:3000


Voter List Display Logic
UI Components
General Members: GMVoterList.jsx
Life Members: LMVoterList.jsx
Both use a shared VoterList.jsx table component
Key Differences
Aspect	General Member (GM)	Life Member (LM)
Member Type Filter	gmLmMemberType = 1	gmLmMemberType = 2
Date Filtering	YES - Has date-based eligibility	NO - Permanent voters, no date filtering
Eligibility Criteria	Must have 2+ years membership at month-end AND membership valid until month-end	Must be marked as voter, no date checks
Expiry Check	expiryDate >= eligibilityDate	expiryDate IS NULL OR expiryDate >= eligibilityDate
Membership Date Check	membershipDate <= twoYearsBeforeDate OR createdDate <= twoYearsBeforeTime	membershipDate IS NULL OR membershipDate <= cutoffDate
Backend Endpoints
For General Members:

List: /api/v1/voter/gm - Requires year, month parameters
Search: /api/v1/voter/gm/search - Requires year, month, query parameters
Service: listGmVotersByMonthYear() and searchGmVotersByMonthYear()
For Life Members:

List: /api/v1/voter/lm - Requires year, month parameters (ignored for LM)
Search: /api/v1/voter/lm/search - Simple search without date filtering
Search by Month/Year: /api/v1/voter/lm/search/by-month-year - Same as simple search (month/year params ignored)
Service: listLmVotersByMonthYear() and searchLmVoters() / searchLmVotersByMonthYear()
Database Query Filters
All voters must have:

status = 'ACTIVE'
voter = 'Yes'
registrationType = 'C.O.P No.'
registrationNo IS NOT NULL AND NOT EMPTY
GM-specific filters:

Must have valid C.O.P registration
Must have 2+ years of continuous membership
Membership must not have expired as of the selected month-end
LM-specific filters:

Permanent status (ignored year/month parameters)
No expiry date constraints (lifetime membership)
Frontend Flow
User selects Month and Year
Clicks Generate button
If search query is provided:
GM: Calls gmSearch() with year, month, query
LM: Calls lmSearchByMonthYear() (which ignores year/month on backend)
UI displays paginated results in a table with download-to-Excel option




