# SafeRide v2.0 - Session Context

> **Purpose**: This document provides context for continuing development with Claude Opus 4.5
> **Last Updated**: February 4, 2026
> **Project Location**: `C:\Users\omloh\Desktop\major-project\Project\guardiansync-v2`

---

## 🎯 Project Overview

**SafeRide v2.0** (formerly GuardianSync) is a Child Safety Tracking System rebuilt from a legacy monolithic MVP into a modern microservices architecture. The system enables:

- **Schools/Admins**: Manage students, drivers, buses, and monitor real-time tracking
- **Parents**: Track their children's bus location and receive pickup/dropoff notifications
- **Drivers**: Scan students using face recognition for secure pickup/dropoff verification

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        DOCKER                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  API Gateway    │  │   AI Service    │  │   MongoDB   │ │
│  │  (Node.js)      │  │   (Python)      │  │  (Database) │ │
│  │  Port 3000      │  │   Port 8001     │  │  Port 27017 │ │
│  │  Express + JWT  │  │   FastAPI       │  │             │ │
│  └─────────────────┘  │   face_recog    │  └─────────────┘ │
│                       └─────────────────┘  ┌─────────────┐ │
│                                            │    Redis    │ │
│                                            │   (Cache)   │ │
│                                            │  Port 6379  │ │
│                                            └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
    ┌────┴────────┐     ┌────┴────────┐     ┌────┴────────┐
    │   Admin     │     │   Parent    │     │   Driver    │
    │  Dashboard  │     │   Portal    │     │    App      │
    │  React+Vite │     │  React+Vite │     │ React Native│
    │  Port 5173  │     │  Port 5174  │     │   Expo      │
    └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 📁 Project Structure

```
guardiansync-v2/
├── docker-compose.yml          # Container orchestration
├── .env                        # Environment variables
├── CONTEXT.md                  # This file
│
├── api-gateway/                # Node.js REST API
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Entry point
│       ├── config/             # Configuration
│       ├── controllers/        # Route handlers
│       ├── middleware/         # Auth, validation, errors
│       ├── models/             # Mongoose schemas
│       ├── routes/             # API routes
│       │   ├── auth.routes.js
│       │   ├── student.routes.js
│       │   ├── bus.routes.js
│       │   ├── user.routes.js  # Added for driver CRUD
│       │   └── scan.routes.js
│       ├── services/           # AI service, storage
│       ├── sockets/            # Socket.io real-time
│       ├── utils/              # Logger, helpers
│       └── validators/         # Zod schemas
│
├── ai-service/                 # Python FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       └── main.py             # Face recognition endpoints
│
├── admin-dashboard/            # React + Vite + Tailwind
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── context/AuthContext.jsx
│       ├── services/api.js
│       ├── components/Layout.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx
│           ├── Students.jsx
│           ├── Drivers.jsx
│           ├── Buses.jsx
│           └── LiveTracking.jsx
│
├── parent-portal/              # React + Vite + Tailwind
│   ├── package.json
│   └── src/
│       ├── context/AuthContext.jsx
│       ├── services/api.js
│       └── pages/
│           ├── Login.jsx
│           ├── Home.jsx
│           ├── LiveTracking.jsx
│           ├── History.jsx
│           └── Notifications.jsx
│
└── driver-app/                 # React Native + Expo
    ├── package.json
    ├── app.json
    ├── App.js
    └── src/
        ├── context/AuthContext.js
        ├── services/api.js
        └── screens/
            ├── LoginScreen.js
            ├── HomeScreen.js
            ├── ScanScreen.js
            └── StudentsScreen.js
```

---

## 🔧 Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| API Gateway | Node.js + Express | 20.x |
| AI Service | Python + FastAPI | 3.11 |
| Database | MongoDB | 7.0 |
| Cache | Redis | 7 |
| Admin Dashboard | React + Vite + Tailwind | React 18 |
| Parent Portal | React + Vite + Tailwind | React 18 |
| Driver App | React Native + Expo | Expo SDK 54 |
| Face Recognition | face_recognition + dlib | 19.24.6 |
| Real-time | Socket.io | 4.x |
| Auth | JWT (access + refresh tokens) | - |
| Validation | Zod | - |
| Maps | Leaflet / react-leaflet | - |

---

## ✅ Completed Work

### Backend
- [x] API Gateway with JWT authentication (access + refresh tokens)
- [x] Role-based access control (admin, driver, parent)
- [x] Zod validation on all endpoints
- [x] MongoDB models (User, Student, Bus, BusLocation, ScanRecord)
- [x] AI Service with face encoding endpoint
- [x] Socket.io for real-time bus tracking
- [x] Docker Compose orchestration
- [x] User routes for driver CRUD (added during session)
- [x] Bus delete/update routes (added during session)

### Admin Dashboard
- [x] Login/Register with admin role enforcement
- [x] Dashboard with stats and activity feed
- [x] Students CRUD with photo upload for face registration
- [x] Drivers CRUD
- [x] Buses CRUD with driver assignment
- [x] Live Tracking page with Leaflet map

### Parent Portal
- [x] Login/Register
- [x] Home page with children status
- [x] Live Tracking with bus map
- [x] History page for pickup/dropoff records
- [x] Notifications page

### Driver App
- [x] Login screen
- [x] Home screen with route controls
- [x] Scan screen with camera for face recognition
- [x] Students list with quick actions
- [x] Navigation setup (React Navigation)

---

## 🐛 Issues Fixed During Sessions

### Session 1 (January 27, 2026)
| Issue | Fix |
|-------|-----|
| Admin registration failed (400) | Added `confirmPassword` and `role: 'admin'` to registration payload |
| Login failed - "Cannot read role" | Fixed response structure: `response.data.data.user` and `response.data.data.tokens` |
| Cannot delete buses/drivers | Added DELETE and PUT routes to `bus.routes.js`, created `user.routes.js` |
| Buses/drivers list empty | Added `buses` and `drivers` aliases in API response for frontend compatibility |
| Driver creation failed | Added `confirmPassword` auto-fill in `driversAPI.create()` |
| Phone validation too strict | Relaxed regex to `^[\d\s\-\+\(\)]{7,}$` and allow empty |

### Session 2 (February 4, 2026) - Major Updates
| Issue | Fix |
|-------|-----|
| **Branding Change** | Renamed entire project from "GuardianSync" to "SafeRide" across all files |
| Student creation 400 error | Fixed Zod validation schema - `parentId` should be optional string, not required ObjectId |
| Student creation GeoJSON error | Fixed `pickupLocation` to use proper GeoJSON format `{ type: 'Point', coordinates: [lng, lat] }` |
| Admin dashboard student list empty | Fixed API response mismatch - frontend expected `students` array but API returned `data` |
| Driver app Expo SDK mismatch | Upgraded from Expo SDK 50 → SDK 54 for Expo Go compatibility |
| Driver app missing assets | Created `assets/` folder with placeholder icons (icon.png, splash.png, adaptive-icon.png, favicon.png) |
| Driver app missing babel-preset-expo | Installed `babel-preset-expo` package |
| Driver app missing async-storage | Installed `@react-native-async-storage/async-storage` package |
| Driver app Network Error | Changed API URL from `localhost:3000` to `192.168.29.230:3000` (computer's local IP) |
| Driver app 404 on login | Fixed API base URL from `/api` to `/api/v1` to match backend routes |
| Driver app login "Cannot read role" | Fixed AuthContext to use `response.data.data.user` and `response.data.data.tokens.accessToken` |

---

## 📝 API Response Structures

### Auth Register/Login Response
```javascript
{
  success: true,
  data: {
    user: { id, email, name, role },
    tokens: { accessToken, refreshToken, expiresIn }
  }
}
```

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Example: `Admin123!`

---

## 🚀 How to Run

### 1. Start Backend (Docker)
```bash
cd C:\Users\omloh\Desktop\major-project\Project\guardiansync-v2
docker-compose up -d
```

### 2. Verify Health
```bash
docker ps
# All 4 containers should show "healthy"
```

### 3. Start Admin Dashboard
```bash
cd admin-dashboard
npm install
npm run dev
# Opens at http://localhost:5173
```

### 4. Start Parent Portal
```bash
cd parent-portal
npm install
npm run dev
# Opens at http://localhost:5174
```

### 5. Start Driver App
```bash
cd driver-app
npm install
npx expo start
# Scan QR with Expo Go app
```

---

## 🧪 Demo Flow

1. **Register Admin** at http://localhost:5173 (Register page)
2. **Login as Admin**
3. **Create a Driver** (Drivers → Add Driver)
4. **Create a Student** with photo (Students → Add Student)
5. **Create a Bus** and assign driver (Buses → Add Bus)
6. **Register Parent** at http://localhost:5174
7. **Driver logs in** to mobile app with created credentials
8. **Start route** on driver app → Bus appears on Live Tracking maps
9. **Scan student** → Status updates across all dashboards

---

## ⚠️ Known Considerations

1. **Pylance warnings** in `ai-service/app/main.py` - These are expected because packages are installed in Docker, not locally

2. **Storage** - Currently using local disk (`/uploads`). For production, configure S3/Cloudinary

3. **Face encoding** - Stored as 128-float array in MongoDB, actual images go to cloud storage

4. **Soft deletes** - Buses and users are soft-deleted (`isActive: false`), not removed from DB

---

## 📞 API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/v1/auth/register | Register user | Public |
| POST | /api/v1/auth/login | Login | Public |
| GET | /api/v1/auth/me | Get current user | Required |
| GET | /api/v1/students | List students | Admin |
| POST | /api/v1/students | Create student | Admin |
| POST | /api/v1/students/:id/face | Register face | Admin |
| GET | /api/v1/buses | List buses | Admin/Driver |
| POST | /api/v1/buses | Create bus | Admin |
| DELETE | /api/v1/buses/:id | Delete bus | Admin |
| GET | /api/v1/users?role=driver | List drivers | Admin |
| DELETE | /api/v1/users/:id | Delete user | Admin |
| POST | /api/v1/scan/pickup | Record pickup | Driver |
| POST | /api/v1/scan/dropoff | Record dropoff | Driver |

---

## 🔑 Environment Variables

Located in `.env` file:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret-key
MONGODB_URI=mongodb://mongodb:27017/guardiansync
REDIS_URL=redis://redis:6379
AI_SERVICE_URL=http://ai-service:8001
```

---

## 📌 Current Testing Status (February 4, 2026)

### ✅ Working Components
- **Docker Backend**: All 4 containers running healthy (SafeRide-api, SafeRide-mongodb, SafeRide-redis, SafeRide-ai)
- **Admin Dashboard**: Running on http://localhost:5173
  - Login/Register ✅
  - Create Students ✅
  - Dashboard displays stats ✅
- **Driver App**: Running via Expo Go (SDK 54)
  - Login ✅
  - Home screen displays (with mock data) ✅
  - "Failed to fetch route" - Expected until bus/students are created

### ⏳ Remaining Setup Steps
1. **Create a Bus** in Admin Dashboard (Buses page)
2. **Assign driver** (`driver@saferide.com`) to the bus
3. **Create Students** with photos for face recognition
4. **Assign students** to the bus
5. **Test face scan** functionality in driver app

### 🔑 Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@saferide.com | Admin123! |
| Driver | driver@saferide.com | driver123 |

---

## 📌 Key File Changes (Session 2)

### Driver App Files Modified
| File | Change |
|------|--------|
| `driver-app/package.json` | Upgraded to Expo SDK 54 dependencies |
| `driver-app/src/services/api.js` | Changed `API_URL` to `http://192.168.29.230:3000/api/v1` |
| `driver-app/src/context/AuthContext.jsx` | Fixed login response parsing |
| `driver-app/assets/` | Created folder with placeholder images |

### API Gateway Files Modified
| File | Change |
|------|--------|
| `api-gateway/src/validators/schemas.js` | Fixed `studentSchema` - made `parentId` optional |
| `api-gateway/src/controllers/student.controller.js` | Fixed GeoJSON format for `pickupLocation` |

### Admin Dashboard Files Modified
| File | Change |
|------|--------|
| `admin-dashboard/src/pages/Students.jsx` | Fixed API response handling for student list |

---

## 📌 Next Steps (If Continuing)

1. Complete bus and student setup in Admin Dashboard
2. Test full demo flow end-to-end with face scan
3. Test Parent Portal login and tracking
4. Verify Socket.io real-time updates across dashboards
5. Test notification system (email/SMS)

---

*This context file was last updated on February 4, 2026 to document SafeRide branding change and driver app fixes.*
