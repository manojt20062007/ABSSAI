# 🚌 ABSSAI - AI-Powered Automated Bus Scheduling & Route Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor_Android-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)

**ABSSAI** is an enterprise-grade, end-to-end intelligent transit management ecosystem designed for educational institutions and municipal transport authorities. It automates bus scheduling, route optimization, driver rosters, passenger demand forecasting, and student boarding via QR code verification while providing real-time GPS telemetry tracking across web and native mobile applications.

---

## 📐 Monorepo Architecture

```
ABSSAI/
├── backend/            # Express.js REST API, Socket.IO server & Prisma ORM engine
├── admin-app/          # Admin Web Application & Management Dashboard (Vite + React)
├── driver-app/         # Driver Mobile Web/Android App with QR Scanner & Route Guidance
├── student-app/        # Student Mobile Web/Android App with Digital Pass & Bus Tracking
├── shared/             # Shared TypeScript data models, interfaces, and contracts
└── docker-compose.yml  # Containerization configuration for PostgreSQL & Redis
```

---

## ✨ Key System Features

### 🏢 1. Admin Portal (`admin-app`)
* **Fleet & Bus Management**: Complete lifecycle tracking for buses, fuel logs, maintenance, insurance, and fitness expiry dates.
* **Driver & Staff Allocation**: Driver rosters, shift scheduling, medical fitness checks, and automated attendance logs.
* **Smart Route Builder**: Interactive route and bus stop planning with spatial map coordinates (Leaflet).
* **Automated Schedule Generator**: AI/algorithmic dispatching based on peak/off-peak frequencies and demand.
* **Live GPS Fleet Map**: Real-time multi-vehicle tracking via Socket.IO WebSocket streams.
* **Analytics & Reporting**: Interactive data visualizations for fleet mileage, fuel costs, passenger trends, and export options (PDF/Excel).

### 👨‍✈️ 2. Driver Application (`driver-app`)
* **Trip Execution**: Duty view, assigned route stop sequences, estimated arrival times, and departure logging.
* **QR Boarding Scanner**: Built-in camera scanner (`html5-qrcode`) to validate student digital passes instantly.
* **Live GPS Broadcasting**: Transmits real-time vehicle geolocation and speed telemetry back to the central server.
* **Shift & Attendance**: Simple check-in / check-out mechanism for driver shifts.

### 🎓 3. Student Application (`student-app`)
* **Digital Bus Pass**: Dynamic, encrypted QR code generation (`qrcode.react`) for contactless bus boarding.
* **Live Bus Location Tracking**: Interactive map displaying assigned bus position, stop radius, and ETA.
* **Route Finder & Stop Schedules**: Search bus stops, route timings, and frequency details.
* **Notifications**: Push & in-app alerts for bus arrival, delays, route modifications, or emergency notices.

### ⚙️ 4. Core Backend (`backend`)
* **RBAC & Security**: JWT-based authentication supporting 6 roles (`SUPER_ADMIN`, `ADMIN`, `SCHEDULER`, `TRANSPORT_ADMIN`, `DRIVER`, `STUDENT`) with rate-limiting and Helmet security header protection.
* **Socket.IO Telemetry Engine**: Low-latency bidirectional WebSocket communication for GPS streaming and simulator.
* **Prisma ORM & PostgreSQL**: Robust data persistence for relational entities, audit logs, and geospatial coordinates.
* **Redis Caching**: Cache layer for real-time bus locations and rapid session handling.

---

## 🛠️ Technology Stack

| Domain | Technologies |
| --- | --- |
| **Backend** | Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL, Redis, Socket.IO, Zod, Winston |
| **Frontend UI** | React 19, Vite, TypeScript, Tailwind CSS v4, Radix UI, Lucide Icons, Framer Motion |
| **Mapping & GIS** | Leaflet, React-Leaflet |
| **Mobile Integration** | Capacitor 8 (Android build target support for all client frontends) |
| **Data Utilities** | Recharts, jsPDF, XLSX, html5-qrcode, qrcode.react |
| **DevOps & Infra** | Docker, Docker Compose, tsx |

---

## 🚀 Services & Ports Overview

| Component | Dev Port / URL | Description |
| --- | --- | --- |
| **Backend REST API** | `http://localhost:3001/api` | Central API service & health check (`/api/health`) |
| **Socket.IO Server** | `http://localhost:3001` | Real-time GPS & WebSocket event hub |
| **Admin App** | `http://localhost:5173` | Admin & Transport Manager Dashboard |
| **Driver App** | `http://localhost:5174` | Driver Trip & QR Scanner Interface |
| **Student App** | `http://localhost:5175` | Student Portal & Digital Bus Pass |
| **PostgreSQL Database** | `localhost:5434` | Relational Database (Containerized) |
| **Redis Cache** | `localhost:6379` | In-Memory Cache (Containerized) |

---

## ⚡ Quick Start & Installation

### Prerequisites
* **Node.js**: v18.x or v20.x+
* **npm**: v9.x+ or **yarn** / **pnpm**
* **Docker Desktop** (or standalone PostgreSQL & Redis instances)

---

### Step 1: Clone & Configure Environment

```bash
# Navigate to the project root
cd ABSSAI

# Copy environment template
cp .env.example .env
```

Ensure `.env` matches your local environment:
```env
DATABASE_URL=postgresql://abssai:abssai_secret@localhost:5434/abssai_db
POSTGRES_USER=abssai
POSTGRES_PASSWORD=abssai_secret
POSTGRES_DB=abssai_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

---

### Step 2: Start PostgreSQL & Redis

Launch database containers via Docker Compose:
```bash
docker compose up -d
```

---

### Step 3: Setup Backend & Database

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma Client & push database schema
npm run db:generate
npm run db:push

# Seed database with sample routes, buses, stops, users, and drivers
npm run db:seed

# Start backend dev server
npm run dev
```

The backend server will run at **`http://localhost:3001`**.

---

### Step 4: Start Frontend Applications

Open new terminal windows for each frontend application:

#### Admin Portal (`admin-app`)
```bash
cd admin-app
npm install
npm run dev
```
👉 Access Admin Dashboard at **`http://localhost:5173`**

#### Driver App (`driver-app`)
```bash
cd driver-app
npm install
npm run dev
```
👉 Access Driver App at **`http://localhost:5174`**

#### Student App (`student-app`)
```bash
cd student-app
npm install
npm run dev
```
👉 Access Student App at **`http://localhost:5175`**

---

## 📡 API Endpoint Summary

| Category | Endpoint Base | Description |
| --- | --- | --- |
| **Auth** | `/api/auth` | Login, Register, Refresh Token, OTP Verification |
| **Buses** | `/api/buses` | Bus CRUD, status updates, mileage, driver assignment |
| **Drivers** | `/api/drivers` | Driver profiles, shifts, license validation |
| **Routes & Stops** | `/api/routes`, `/api/stops` | Route polyline, stop sequences, schedule links |
| **Depots** | `/api/depots` | Bus depot capacity, location & phone contacts |
| **Trips & Schedules** | `/api/trips`, `/api/schedules` | Trip creation, status tracking, schedule generation |
| **Boarding** | `/api/boarding` | QR scan verification & boarding logs |
| **Telemetry** | `/api/telemetry` | GPS logs, speed history, live location telemetry |
| **Analytics & Reports**| `/api/analytics`, `/api/reports` | Fleet statistics, passenger demand, PDF/XLSX export |
| **Notifications** | `/api/notifications` | User broadcast & system alerts |

---

## 📱 Mobile App Building (Android via Capacitor)

Each frontend (`admin-app`, `driver-app`, `student-app`) includes Capacitor for compiling into native Android APKS.

To sync and build for Android:
```bash
# Example for driver-app
cd driver-app

# Build web distribution assets
npm run build

# Copy build to native Android project
npx cap sync android

# Open project in Android Studio
npx cap open android
```

---

## 📄 License

This project is proprietary and maintained for institutional bus fleet management and route automation.
