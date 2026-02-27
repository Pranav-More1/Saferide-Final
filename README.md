# SafeRide v2.0 - Child Safety Tracking System

## Architecture Overview

This system uses a **microservices-lite** pattern with the following components:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPS                               │
│  (React Admin Portal, React Native Driver/Parent Apps)          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                 │
│  Node.js/Express + Socket.io                                    │
│  - Authentication (JWT + RBAC)                                  │
│  - Business Logic Controllers                                   │
│  - Real-time Location Broadcasting                              │
│  - Request Validation (Zod)                                     │
└──────────────┬─────────────────────┬────────────────────────────┘
               │                     │
               ▼                     ▼
┌──────────────────────┐  ┌─────────────────────────────────────┐
│     AI SERVICE       │  │           DATABASES                  │
│  Python FastAPI      │  │  ┌───────────┐  ┌─────────────────┐ │
│  - Face Encoding     │  │  │  MongoDB  │  │  Redis (opt)    │ │
│  - Face Comparison   │  │  │  Users    │  │  Location Cache │ │
│  - Non-blocking      │  │  │  Students │  │  Session Store  │ │
└──────────────────────┘  │  │  Buses    │  │                 │ │
                          │  └───────────┘  └─────────────────┘ │
                          └─────────────────────────────────────┘
```

## Directory Structure

```
SafeRide-v2/
├── api-gateway/          # Node.js Express API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, validation, RBAC
│   │   ├── validators/   # Zod schemas
│   │   ├── sockets/      # Socket.io handlers
│   │   ├── utils/        # Helper functions
│   │   └── config/       # Configuration
│   └── package.json
│
├── ai-service/           # Python FastAPI
│   ├── app/
│   │   ├── main.py       # FastAPI app
│   │   ├── routers/      # API routes
│   │   ├── services/     # Face recognition logic
│   │   └── schemas/      # Pydantic models
│   ├── requirements.txt
│   └── Dockerfile
│
└── docker-compose.yml    # Orchestration
```

## Key Design Decisions

### 1. Face Encoding Storage (NOT Base64 Images)
- Images uploaded to cloud storage (S3/Cloudinary)
- Only `face_encoding` (128-float array) stored in MongoDB
- `photo_url` stores the CDN link

### 2. Non-Blocking Face Recognition
- All CPU-intensive face operations offloaded to Python AI service
- Node.js gateway remains responsive for real-time operations

### 3. Real-Time Location
- Socket.io rooms per bus/route
- Location updates throttled to prevent DB flooding
- Redis pub/sub ready for horizontal scaling

### 4. Security
- JWT with role-based access (Admin, Driver, Parent)
- Zod validation on all inputs
- Environment-based configuration

## Getting Started

```bash
# 1. Start AI Service
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# 2. Start API Gateway
cd api-gateway
npm install
npm run dev

# 3. Or use Docker Compose
docker-compose up
```

## Environment Variables

See `.env.example` files in each service directory.
