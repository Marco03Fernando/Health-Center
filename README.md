# Health Center — Full Stack Application

Comprehensive full-stack healthcare management system providing appointment booking, patient management, pharmacy orders, diagnostic tests, and role-based administration.

This repository contains a Node.js (Express) REST API backend and a React frontend (Vite).

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Deployment Details](#deployment-details)
- [Testing Instructions](#testing-instructions-summary)


---

## Project Overview

Health Center is a domain-specific healthcare management application designed to support multiple user roles (patients, doctors, lab technicians, pharmacists, and administrators). It provides:

- Appointment scheduling and slot management
- Patient registration and profile management
- Doctor availability and channeling
- Pharmacy inventory and order processing
- Diagnostic test requests and results
- Role-based access control and administrative tools
- Integration with third-party services (e.g., payment gateways, SMS/email providers, external health APIs)

Key capabilities include CRUD operations for all core resources, JWT-based authentication, role-aware authorization, server-side validation and error handling, pagination/filtering/search, and a test suite for unit and integration tests.

## Tech Stack

- Backend: Node.js, Express.js, MongoDB (Mongoose)
- Frontend: React (Vite), Context API (or Redux as an option)
- Authentication: JSON Web Tokens (JWT)
- Styling: Tailwind CSS (or Bootstrap depending on client config)
- Testing: Jest, Supertest (backend), React Testing Library (frontend)
- Dev tooling: ESLint, Prettier, Husky (optional), Vite (frontend)
- API: Docementation Postman collection for API exploration

## System Architecture

**Backend**

- `routes/`: Express route definitions grouped by resource (auth, users, appointments, pharmacy, lab, admin).
- `controllers/`: Controllers that parse requests, call services, and return responses.
- `services/`: Business logic and orchestration (database calls, third-party API calls).
- `models/`: Mongoose models and schemas for Users, Appointments, Medications, Tests, etc.
- `middlewares/`: Authentication (JWT verification), authorization (role checks), validation, and error handling.
- `utils/`: Helper functions (pagination, response formatting, logger).

Request flow: routes -> controllers -> services -> models -> DB. Middlewares run at the route level for auth and validation.

**Frontend**

- `src/components/`: Reusable UI pieces (Navbar, AppointmentCard, DoctorCard, SlotPicker, StatusBadge).
- `src/pages/`: Route-specific pages (public, user, doctor, admin, pharmacy, lab).
- `src/contexts/`: Context providers for auth and app state (AuthContext, UserAppContext, CenterAdminContext, etc.).
- `src/lib/`: API client wrappers and utility functions.
- `src/services/`: Client-side services that call backend endpoints.

Data flow: UI components dispatch actions / call context methods -> context updates state -> components re-render. API calls use `fetch`/`axios` to talk to backend endpoints.

Frontend ↔ Backend communication: RESTful JSON APIs secured with JWT tokens sent in the `Authorization: Bearer <token>` header.

## Setup Instructions

Follow the steps below to run the project locally.

1. Clone the repository

```bash
git clone https://github.com/Marco03Fernando/Health-Center.git
cd health-center
```

2. Backend setup

```bash
cd server
npm install
# copy or create .env (see .env.example)
```

Environment variables (example, do NOT commit secrets):

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `PORT` — Backend port (e.g., 4000)
- `EMAIL_API_KEY`, `SMS_API_KEY` — Third-party provider keys (optional)

Run backend (development):

```bash
npm run dev
# or
node src/server.js
```

3. Frontend setup

```bash
cd ../client
npm install
# copy .env.local if needed
npm run dev
```

Open the frontend in the browser (Vite dev): http://localhost:8080

## API Documentation

- Server API documentation (detailed module READMEs):
	- [Pharmacy API](server/docs/pharmacy_api_README.md)
	- [Appointment API](server/docs/appointment_api_README.md)
	- [Doctor Channeling API](server/docs/doctor_channeling_api_README.md)
	- [Test Management API](server/docs/test_management_api_README.md)
	- [Auth API](server/docs/auth_api_README.md)

-- Postman collection (import into Postman or run with Newman):
	- [HealthCenter.postman_collection.json](server/postman/HealthCenter.postman_collection.json)

Quick import / run (optional):

```bash
# Import in Postman UI or run with Newman
npx newman run server/postman/HealthCenter.postman_collection.json
```

Authentication: All protected endpoints require an `Authorization` header with a valid JWT: `Authorization: Bearer <token>`.


Representative API endpoints and full reference are maintained in the server docs and the included Postman collection. See the links above under "API docs & Postman collection" for the complete per-module reference and runnable examples.

## Deployment Details

Backend
- Render

Backend setup 
1. Create a new Node.js service on the chosen platform.
2. Connect a Git repository or enable Deploy from GitHub.
3. Set the start command: `npm start` (use `npm run dev` only for development deployments).
4. Add environment variables in the platform dashboard (see list below).
5. Provision a MongoDB instance (Atlas or hosted) and set `MONGO_URI` to point to it.
6. Deploy and verify logs; ensure the API responds at the assigned domain.

Frontend
- Vercel 

Frontend setup 
1. Create a new project on Vercel and connect the `client/` folder repository (or point to root and set `client` as the build directory).
2. Set the build command: `npm run build` and the output directory: `dist` (Vite default).
3. Add environment variables (see list) such as `VITE_API_BASE_URL` pointing to the backend API base URL.
4. Deploy and verify the site loads and communicates with the backend.

Environment variables
- `MONGO_URI` — MongoDB connection string (secret)
- `JWT_SECRET` — JWT signing secret (secret)
- `PORT` — Backend port (optional; host may override)
- `VITE_API_BASE_URL` — Frontend build-time API base URL
- `EMAIL_PROVIDER_API_KEY` — (optional) third-party email service key
- `SMS_PROVIDER_API_KEY` — (optional) SMS service key
- `TEST_MONGO_URI` — Test DB connection string (CI)

Live URLs
- Backend API: https://api.health-center.example.com (example placeholder)
- Frontend: https://health-center-iota.vercel.app

Deployment evidence and screenshots


### Backend console
![Backend health check](docs/screenshots/deploy-backend.png)

### Deployed frontend screenshot
![Deployed frontend](docs/screenshots/deploy-frontend.png)

### Build / deploy logs
![Build logs](docs/screenshots/deploy-logs.png)


## Testing Instructions (summary)

- Unit tests: run the backend Jest suite (`server`); use `npm test` and `npm run test:watch` for development.
- Integration tests: run Supertest-based tests against a dedicated test DB. Set `TEST_MONGO_URI` and `NODE_ENV=test` before running. Full details: [docs/TESTING_INSTRUCTIONS.md](docs/TESTING_INSTRUCTIONS.md).
- Performance testing: use Artillery (or k6/JMeter) against a staging endpoint. See `docs/TESTING_INSTRUCTIONS.md` for examples and recommended scripts.

Link to full testing report and commands: [docs/TESTING_INSTRUCTIONS.md](docs/TESTING_INSTRUCTIONS.md)

### Coverage reports

- Backend (coverage report): [server/coverage/index.html](server/coverage/index.html)
- Frontend (coverage report): placeholder — see `docs/coverage/frontend-coverage-placeholder.txt`

