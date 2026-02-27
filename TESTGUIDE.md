# SafeRide v2.0 - Complete Testing Guide

## Prerequisites Checklist

Before starting, ensure you have:
- ✅ Docker Desktop running
- ✅ Node.js (v18+) installed
- ✅ Expo Go app on your phone (for driver app testing)
- ✅ A modern web browser

---

## Step 1: Start Backend Services (Docker)

```powershell
cd c:\Users\omloh\Desktop\major-project\Project\SafeRide-v2
docker-compose up -d
```

**Verify services are running:**
```powershell
docker-compose ps
```

Expected healthy services:
| Service | Port | Purpose |
|---------|------|---------|
| api-gateway | 3000 | Main API + WebSocket |
| ai-service | 8001 | Face recognition |
| mongodb | 27017 | Database |
| redis | 6379 | Caching/sessions |

**Check API is responding:**
```powershell
curl.exe http://localhost:3000/health
```

---

## Step 2: Start Frontend Applications

Open **3 separate terminals**:

### Terminal 1 - Admin Dashboard
```powershell
cd c:\Users\omloh\Desktop\major-project\Project\SafeRide-v2\admin-dashboard
npm install
npm run dev
```
→ Opens at **http://localhost:5173**

### Terminal 2 - Parent Portal
```powershell
cd c:\Users\omloh\Desktop\major-project\Project\SafeRide-v2\parent-portal
npm install
npm run dev
```
→ Opens at **http://localhost:5174**

### Terminal 3 - Driver App (Expo)
```powershell
cd c:\Users\omloh\Desktop\major-project\Project\SafeRide-v2\driver-app
npm install
npx expo start
```
→ Scan QR code with **Expo Go** app on your phone

---

## Step 3: Create Test Accounts

### 3.1 Create Admin Account

**Option A - Via API:**
```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d "{\"name\": \"Admin User\", \"email\": \"admin@SafeRide.com\", \"password\": \"Admin123!\", \"role\": \"admin\"}"
```

**Option B - Via Admin Dashboard:**
1. Go to http://localhost:5173
2. Click "Register" 
3. Fill in admin details

### 3.2 Create Driver Account
```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d "{\"name\": \"John Driver\", \"email\": \"driver@SafeRide.com\", \"password\": \"Driver123!\", \"role\": \"driver\"}"
```

### 3.3 Create Parent Account
```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d "{\"name\": \"Jane Parent\", \"email\": \"parent@SafeRide.com\", \"password\": \"Parent123!\", \"role\": \"parent\", \"phone\": \"+1234567890\"}"
```

---

## Step 4: Test Admin Dashboard Features

**Login:** http://localhost:5173 with `admin@SafeRide.com` / `Admin123!`

### 4.1 Dashboard Page
- [ ] View overview statistics
- [ ] Check bus status summary
- [ ] Verify recent activity feed

### 4.2 Students Management (Students Page)
- [ ] **Add a student:**
  - Click "Add Student"
  - Fill: Name, Grade, Parent Name, Parent Phone, Parent Email
  - Upload a clear face photo (for face recognition)
  - Submit and verify student appears in list

- [ ] **Edit a student:**
  - Click edit icon on a student
  - Modify details
  - Save and verify changes

- [ ] **View student details:**
  - Click on a student row
  - Verify attendance history displays

### 4.3 Buses Management (Buses Page)
- [ ] **Add a bus:**
  - Click "Add Bus"
  - Fill: Bus Number, Capacity, License Plate
  - Assign driver (`driver@SafeRide.com`)
  - Submit

- [ ] **Assign students to bus:**
  - Edit bus
  - Select students from list
  - Save assignment

### 4.4 Drivers Management (Drivers Page)
- [ ] View list of drivers
- [ ] Verify driver-bus assignments

### 4.5 Live Tracking Page
- [ ] View map with bus locations
- [ ] Click on bus marker to see details
- [ ] Verify real-time updates when driver app is active

---

## Step 5: Test Driver App Features (Mobile)

**Login:** Use `driver@SafeRide.com` / `Driver123!`

### 5.1 Home Screen
- [ ] View assigned route information
- [ ] See student pickup/dropoff stats
- [ ] **Start Route** button activates GPS tracking

### 5.2 Scan Screen (Face Recognition) - **Four-Step Commute Testing**

**Morning Commute Test:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select "Morning Pickup" mode | Mode indicator shows morning_pickup |
| 2 | Scan student's face at home | Status → `morning_picked_up` |
| 3 | Select "Morning Dropoff" mode | Mode indicator shows morning_dropoff |
| 4 | Scan same student at school | Status → `at_school` |

**Evening Commute Test:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5 | Select "Evening Pickup" mode | Mode indicator shows evening_pickup |
| 6 | Scan student at school | Status → `evening_picked_up` |
| 7 | Select "Evening Dropoff" mode | Mode indicator shows evening_dropoff |
| 8 | Scan student at home | Status → `dropped_home` |

### 5.3 Students Screen
- [ ] View list of assigned students
- [ ] Check boarding status badges (color-coded)
- [ ] Filter by status
- [ ] Manual attendance override (if face scan fails)

### 5.4 GPS Tracking
- [ ] Start route on Home screen
- [ ] Verify location updates in Admin Live Tracking
- [ ] Verify location updates in Parent Portal

---

## Step 6: Test Parent Portal Features

**Login:** http://localhost:5174 with `parent@SafeRide.com` / `Parent123!`

### 6.1 Home Page
- [ ] View children's cards with current status
- [ ] Status badge shows correct Four-Step status:
  - 🔴 `not_boarded` - Not Boarded
  - 🟡 `morning_picked_up` - On Bus (Morning)
  - 🟢 `at_school` - At School
  - 🟠 `evening_picked_up` - On Bus (Evening)
  - 🟢 `dropped_home` - Home Safe
  - ⚫ `absent` - Absent

- [ ] View last scan time and type

### 6.2 Live Tracking Page
- [ ] See bus location on map
- [ ] View ETA to your stop
- [ ] Real-time position updates

### 6.3 History Page
- [ ] View attendance history
- [ ] Filter by date range
- [ ] See all scan events with timestamps

### 6.4 Notifications Page
- [ ] View notification history
- [ ] Check pickup/dropoff notifications

---

## Step 7: Test Email/SMS Notifications (Feature #2)

### 7.1 Configure Notifications

Check `api-gateway/.env` has:
```env
# Email (use test credentials or real SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@SafeRide.com

# SMS (Twilio - optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Enable notifications
NOTIFICATIONS_ENABLED=true
```

### 7.2 Test Notification Flow
1. Perform a scan in driver app
2. Check parent's email inbox
3. Check SMS (if Twilio configured)

**Expected notifications:**
| Scan Type | Email Subject |
|-----------|---------------|
| morning_pickup | "🚌 [Child] has been picked up" |
| morning_dropoff | "🏫 [Child] has arrived at school" |
| evening_pickup | "🚌 [Child] is heading home" |
| evening_dropoff | "🏠 [Child] has arrived home safely" |

---

## Step 8: Test Absentee Auto-Detection (Feature #3)

### 8.1 Verify Scheduler is Running
```powershell
docker-compose logs api-gateway | Select-String "scheduler"
```

Expected output:
```
Scheduler initialized with 2 active jobs
```

### 8.2 Test Manual Absentee Detection

**Via API (requires admin token):**
```powershell
# First login to get token
$response = curl.exe -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\": \"admin@SafeRide.com\", \"password\": \"Admin123!\"}"

# Then trigger detection (replace YOUR_TOKEN with actual token from login response)
curl.exe -X POST http://localhost:3000/api/v1/attendance/detect-absentees -H "Authorization: Bearer YOUR_TOKEN"
```

### 8.3 Scheduled Detection Times
The scheduler runs at:
- **9:30 AM** - Detect students not picked up
- **5:00 AM** - Reset daily attendance

---

## Step 9: Test Real-Time Features (WebSocket)

### 9.1 Multi-Window Test
1. Open Admin Dashboard → Live Tracking
2. Open Parent Portal → Live Tracking
3. Open Driver App → Start Route
4. Perform a scan

**Verify:**
- [ ] Admin sees scan update immediately
- [ ] Parent sees child status change immediately
- [ ] Map markers update in real-time

### 9.2 Connection Resilience
1. Stop API gateway: `docker-compose stop api-gateway`
2. Verify frontends show "Disconnected" state
3. Restart: `docker-compose start api-gateway`
4. Verify automatic reconnection

---

## Step 10: Test Face Recognition (AI Service)

### 10.1 Verify AI Service
```powershell
curl.exe http://localhost:8001/health
```

### 10.2 Test Face Encoding
1. Add a student with a clear face photo
2. In driver app, scan that student's face
3. Verify recognition succeeds

### 10.3 Test Unknown Face
1. Scan a face not in the system
2. Verify "Unknown student" response
3. Option to use manual attendance

---

## Troubleshooting Guide

### Backend Issues

| Problem | Solution |
|---------|----------|
| API not responding | `docker-compose restart api-gateway` |
| Database connection failed | `docker-compose restart mongodb` |
| Face recognition fails | `docker-compose restart ai-service` |
| Scheduler not running | Check logs: `docker-compose logs api-gateway` |

### Frontend Issues

| Problem | Solution |
|---------|----------|
| Can't login | Check API is running on port 3000 |
| WebSocket disconnected | Refresh page, check API health |
| Map not loading | Check API keys in `.env` |

### Driver App Issues

| Problem | Solution |
|---------|----------|
| Expo won't start | `npx expo start --clear` |
| Camera not working | Check permissions in app settings |
| Can't connect to API | Ensure phone is on same network, use local IP |

### Database Commands

```powershell
# View all students
docker exec SafeRide-mongodb mongosh SafeRide --eval "db.students.find().pretty()"

# View all users
docker exec SafeRide-mongodb mongosh SafeRide --eval "db.users.find().pretty()"

# Clear students collection
docker exec SafeRide-mongodb mongosh SafeRide --eval "db.students.deleteMany({})"

# View all buses
docker exec SafeRide-mongodb mongosh SafeRide --eval "db.buses.find().pretty()"
```

---

## Test Completion Checklist

### Core Features
- [ ] User authentication (Admin, Driver, Parent)
- [ ] Student CRUD operations
- [ ] Bus management
- [ ] Driver assignment

### Feature #1: Four-Step Commute
- [ ] Morning pickup scan
- [ ] Morning dropoff scan
- [ ] Evening pickup scan
- [ ] Evening dropoff scan
- [ ] Status transitions validated

### Feature #2: Notifications
- [ ] Email on pickup
- [ ] Email on dropoff
- [ ] SMS notifications (if configured)
- [ ] Absence notification

### Feature #3: Absentee Detection
- [ ] Scheduler running
- [ ] Manual detection works
- [ ] Absent status applied
- [ ] Parents notified

### Real-Time
- [ ] Live GPS tracking
- [ ] Instant scan updates
- [ ] WebSocket reconnection

---

## Quick Reference - API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/auth/register` | POST | User registration |
| `/api/v1/students` | GET | List students |
| `/api/v1/students` | POST | Create student |
| `/api/v1/students/:id/photo` | POST | Upload face photo |
| `/api/v1/buses` | GET/POST | Bus management |
| `/api/v1/scan/face` | POST | Face scan |
| `/api/v1/scan/manual` | POST | Manual attendance |
| `/health` | GET | API health check |

---

## Environment URLs

| Service | URL |
|---------|-----|
| Admin Dashboard | http://localhost:5173 |
| Parent Portal | http://localhost:5174 |
| API Gateway | http://localhost:3000 |
| AI Service | http://localhost:8001 |

---

*Last Updated: February 1, 2026*
