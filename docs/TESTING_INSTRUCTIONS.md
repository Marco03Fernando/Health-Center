# Testing Instructions — Health Center

This document is our project group's reference for running all tests (unit, integration, and performance) across both the frontend and backend. It also describes how our testing environment is configured and what each layer of the test suite covers.

---

## Table of Contents

1. [How to Run Unit Tests](#1-how-to-run-unit-tests)
   - [Backend Unit Tests](#11-backend-unit-tests)
   - [Frontend Unit Tests](#12-frontend-unit-tests)
2. [Integration Testing Setup and Execution](#2-integration-testing-setup-and-execution)
3. [Performance Testing Setup and Execution](#3-performance-testing-setup-and-execution)
4. [Testing Environment Configuration](#4-testing-environment-configuration)

---

## 1. How to Run Unit Tests

### 1.1 Backend Unit Tests

Our backend unit tests live **colocated** next to the source files they test — same folder, `.test.js` suffix. Every test mocks all external dependencies (Mongoose models, email helpers, auth/role middlewares) so each suite exercises only one module in isolation without touching a real database.

**Prerequisites:** Node.js 18+, run `npm install` once in `server/`.

```bash
cd server
npm install
npm test
```

Jest is configured with `--runInBand` (sequential execution) to avoid port/resource contention between test files. All unit tests and integration tests are collected by the same `npm test` command; Jest automatically distinguishes them by location (`server/src/` vs `server/tests/`).

To run only unit tests (skip integration):

```bash
cd server
npx jest src/
```

To run a single controller or route test file:

```bash
npx jest src/controllers/pharmacy/medicationInventoryController.test.js
```

**Coverage report:**

```bash
cd server
npm run test:coverage
# HTML report generated at server/coverage/index.html
```

**Current results:** 31 total suites, ~340 tests — all passing.

#### Backend unit test inventory

**Controller tests** (`server/src/controllers/`):

| Test file | What it covers |
|-----------|---------------|
| `appoinment/appointmentsController.test.js` | Appointment listing and status management logic |
| `appoinment/appointmentSlotsController.test.js` | Slot generation, availability queries |
| `appoinment/bookingController.test.js` | Booking creation and cancellation |
| `appoinment/diagnosticTest.controller.test.js` | Diagnostic test CRUD controller |
| `auth/Doc_adminAuth.controller.test.js` | Doctor and admin authentication |
| `auth/userAuth.controller.test.js` | Patient registration and login |
| `doctorChanneling/appointment.controller.test.js` | Doctor channeling appointment controller |
| `doctorChanneling/center.controller.test.js` | Health center management |
| `doctorChanneling/doctor.controller.test.js` | Doctor profile management |
| `doctorChanneling/prescription.controller.test.js` | Prescription creation and retrieval |
| `pharmacy/medicationInventoryController.test.js` | Medication inventory CRUD |
| `pharmacy/pharmacyOrderController.test.js` | Pharmacy order processing |
| `TestManagement/testResultController.test.js` | Lab result creation and retrieval |
| `TestManagement/testTypeController.test.js` | Test type management |

**Route tests** (`server/src/routes/`):

| Test file | What it covers |
|-----------|---------------|
| `appointment/appointmentRoutes.test.js` | Appointment route handler registration |
| `appointment/appointmentSlotRoutes.test.js` | Slot route handler registration |
| `appointment/diagnosticTest.routes.test.js` | Diagnostic test route wiring |
| `doctorChanneling/admin/adminDoctor.routes.test.js` | Admin doctor route wiring |
| `doctorChanneling/appointment.routes.test.js` | Channeling appointment route wiring |
| `doctorChanneling/center.routes.test.js` | Center route wiring |
| `doctorChanneling/doctor.routes.test.js` | Doctor route wiring |
| `doctorChanneling/prescription.routes.test.js` | Prescription route wiring |
| `doctorChanneling/slot.routes.test.js` | Slot route wiring |
| `pharmacy/medicationInventoryRoutes.test.js` | Medication inventory route wiring |
| `pharmacy/pharmacyOrderRoutes.test.js` | Pharmacy order route wiring |
| `TestManagement/testResultRoutes.test.js` | Test result route wiring |
| `TestManagement/testTypeRoutes.test.js` | Test type route wiring |

---

### 1.2 Frontend Unit Tests

Our frontend tests are also **colocated** next to each source file (e.g., `DoctorCard.test.jsx` lives in the same folder as `DoctorCard.jsx`). We use **Jest** with **React Testing Library** and **jest-dom** for asserting rendered output.

**Prerequisites:** Node.js 18+, run `npm install` once in `client/`.

```bash
cd client
npm install
npm test
```

To run in watch mode during active development (re-runs affected tests on save):

```bash
npm run test:watch
```

To run only a specific file or pattern:

```bash
npx jest --testPathPattern="DoctorCard"
```

**Current results:** 127 test suites, 132 tests — all passing.

#### Frontend test coverage areas

| Folder | What is covered |
|--------|----------------|
| `src/components/` | AppointmentCard, DoctorCard, ProductCard, SlotPicker, StatusBadge, Navbar, Footer, NavLink |
| `src/components/ui/` | All Shadcn/Radix UI primitives — Button, Card, Input, Dialog, Toast, Badge, Sidebar, Table, etc. |
| `src/pages/admin/` | All admin panel pages (dashboard, user management, center management, doctor management) |
| `src/pages/center-admin/` | Center admin portal pages |
| `src/pages/doctor/` | Doctor portal pages (appointments, prescriptions, channeling) |
| `src/pages/lab-tech/` | Lab technician pages (test requests, results) |
| `src/pages/pharmacy/` | Pharmacy portal pages (inventory, orders) |
| `src/pages/user/` | Patient portal pages (booking, history, profile) |
| `src/pages/public/` | Public-facing pages (home, login, register, doctor listing) |
| `src/layouts/` | All role-specific layout wrappers |
| `src/routes/` | All route guard components (AdminRoutes, UserRoutes, DoctorRoutes, etc.) |
| `src/hooks/` | `use-toast`, `use-mobile` |
| `src/lib/` | `api.ts`, `slotUtils.ts`, `utils.ts` |

---

## 2. Integration Testing Setup and Execution

Integration tests live in `server/tests/`. Unlike unit tests, these mount the **real Express application** and run HTTP requests through the full stack — routes → controllers → Mongoose models → MongoDB — so they validate end-to-end request handling and database interaction.

### How it works

We use `mongodb-memory-server` to spin up an **in-memory MongoDB replica set** at the start of each test suite. This means:

- **No real MongoDB URI or running Atlas instance is needed** to run integration tests.
- Each test suite starts with a clean, empty database.
- The in-memory server is torn down and cleaned up automatically after the suite completes.

Auth and role-check middlewares are **Jest-mocked** in integration tests so we can test route logic without needing real JWT tokens. This lets us cover success and failure paths deterministically.

### Running integration tests

Integration tests are included in the default `npm test` run:

```bash
cd server
npm install
npm test
```

To run only integration tests (skip unit tests in `src/`):

```bash
cd server
npx jest tests/
```

To run a single integration test suite:

```bash
npx jest tests/appointment.test.js
```

### Integration test inventory

| File | Routes and scenarios covered |
|------|------------------------------|
| `tests/appointment.test.js` | Appointment booking (`POST /api/bookappointment`), retrieve appointment (`GET /api/appointment/:id`), list user appointments (`GET /api/user-appointments/:userId`), list all appointments (`GET /api/getallappointments`), update status (`PUT /api/updateappointment/:id`), delete appointment (`DELETE /api/deleteappointment/:id`), slot generation (`POST /api/generateSlots`), list slots (`GET /api/getSlots`), delete expired/upcoming slots |
| `tests/diagnosticTest.test.js` | Diagnostic test CRUD — create, list, retrieve by ID, update, delete via `POST/GET/PUT/DELETE /api/lab/diagnostic-tests` |
| `tests/medicationInventory.test.js` | Medication inventory CRUD — create, list, retrieve, update, delete via `/api/medication-inventory`; batch management |
| `tests/pharmacyOrder.test.js` | Pharmacy order lifecycle — create order, retrieve, update status, create from prescription via `/api/pharmacy-orders` |
| `tests/auth.integration.test.js` | Patient registration and login flows, session + JWT behaviour, protected `GET /api/auth/me`, profile update, change password, logout |
| `tests/testType.integration.test.js` | Test type CRUD flows (`/api/test-types`) — create, list, retrieve, update, delete |
| `tests/testResult.integration.test.js` | Test result lifecycle (`/api/test-results`) — create result, list, retrieve, PDF generation, resend notifications (WhatsApp/email) |
| `tests/doctorChanneling.integration.test.js` | Doctor channeling public endpoints and flows: centers (`/api/centers`), doctors (`/api/doctors`), slots (`/api/slots`) and appointment creation (`POST /api/appointments`) including authenticated patient booking |

### Notes on running time

Integration tests take longer than unit tests because each suite boots `mongodb-memory-server`. On a mid-range laptop, expect 30–60 seconds for the full suite. This is normal and expected.

---

## 3. Performance Testing Setup and Execution

We use **Artillery** (v2.0.30) to run load and performance tests against the live backend server. Artillery YAML scripts live in `server/perf/` and cover every API endpoint across the application.

### Prerequisites

1. Artillery is installed as a dev dependency in `server/`. It is available after `npm install`:

   ```bash
   cd server
   npm install
   ```

2. **The backend server must be running** before executing any performance test. Performance tests hit real HTTP endpoints — there is no in-memory mock here.

   Start the server (development mode) in a separate terminal:

   ```bash
   cd server
   npm run dev
   ```

   Confirm it is up by visiting `http://localhost:8081/health` — you should get a `200 OK`.

### Running performance tests

From the `server/` directory, use the npm scripts we provide:

```bash
# Public read-only endpoints (centers, doctors, medications, diagnostic tests, …)
npm run perf

# Authentication flows (user + admin register / login / profile)
npm run perf:auth

# Appointment and slot endpoints
npm run perf:appointments

# All remaining endpoints (doctors admin, prescriptions, pharmacy, test types, test results)
npm run perf:pharmacy

# Run all four scripts back-to-back
npm run perf:all
```

To run a script directly with Artillery and save a JSON report:

```bash
npx artillery run perf/public-endpoints.yml --output perf/reports/public.json
```

To generate an HTML report from a saved JSON:

```bash
npx artillery report perf/reports/public.json
```

### Performance test script inventory

Each script runs three load phases — warm-up, sustained load, and a peak burst — and enforces a `p99 ≤ 2000 ms` pass/fail threshold.

| Script | npm run | Endpoints covered |
|--------|---------|------------------|
| `perf/public-endpoints.yml` | `npm run perf` | `GET /health`, `GET /api/centers`, `GET /api/centers/featured`, `GET /api/doctors`, `GET /api/lab/diagnostic-tests`, `GET /api/medication-inventory`, `GET /api/medication-inventory/test`, `GET /api/pharmacy-orders`, `GET /api/pharmacy-orders/test`, `GET /api/slots` (missing params → 400), `GET /api/getSlots`, `GET /api/test-types`, `GET /api/test-results` |
| `perf/auth-flow.yml` | `npm run perf:auth` | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PATCH /api/auth/me`, `POST /api/admin/auth/login`, `POST /api/admin/auth/logout`, `GET /api/admin/auth/me` |
| `perf/appointment-flow.yml` | `npm run perf:appointments` | `POST /api/appointments`, `GET /api/appointments/user/:userId`, `GET /api/appointments/doctor/me`, `PATCH /api/appointments/:id/status`, `DELETE /api/appointments/:id/cancel`, `POST /api/bookappointment`, `GET /api/appointment/:id`, `GET /api/user-appointments/:id`, `GET /api/getallappointments`, `GET /api/getappointments/:centerId`, `PUT /api/updateappointment/:id`, `DELETE /api/deleteappointment/:id`, `POST /api/generateSlots`, `GET /api/getSlots`, `GET /api/getSlotsByCenter/:centerId`, `GET /api/getAvailableAppointmentSlots/:centerId`, `POST /api/updateSlot/:id`, `DELETE /api/deleteSlot/:id` |
| `perf/pharmacy-flow.yml` | `npm run perf:pharmacy` | `GET /api/doctors`, `GET /api/doctors/:id`, `GET /api/doctors/me` (unauthenticated → 401), `GET /api/admin/doctors` (unauthenticated → 401), `GET /api/centers`, `GET /api/centers/featured`, `GET /api/centers/admin/all` (unauthenticated → 401), `GET/POST /api/prescriptions` (unauthenticated → 401), `GET /api/medication-inventory`, `GET /api/medication-inventory/:id`, `POST /api/medication-inventory` (unauthenticated → 401), `GET /api/pharmacy-orders`, `GET /api/pharmacy-orders/:id`, `POST /api/pharmacy-orders` (unauthenticated → 401), `POST /api/pharmacy-orders/from-prescription` (unauthenticated → 401), `GET /api/lab/diagnostic-tests`, `GET /api/lab/diagnostic-tests/:id`, `POST /api/lab/diagnostic-tests`, `GET /api/test-types`, `GET /api/test-types/:id`, `POST /api/test-types`, `GET /api/test-results`, `GET /api/test-results/:id`, `GET /api/test-results/patient/:patientId`, `POST /api/test-results` |

### Load phases explained

Each script uses the same three-phase load model:

| Phase | Duration | Virtual users | Purpose |
|-------|----------|--------------|---------|
| Warm-up (ramp) | 20–30 s | 1 → 10 VUs | Allow the server to JIT-compile hot paths and DB connection pools to stabilise before measuring |
| Sustained load | 60 s | 10 VUs | Measure steady-state throughput and p50/p95 latency under realistic concurrent load |
| Peak burst | 20–30 s | 20–25 VUs | Simulate a short traffic spike above expected peak — surface latency degradation or error spikes |

### Acceptance thresholds

| Metric | Target |
|--------|--------|
| p99 response time | ≤ 2 000 ms (enforced by Artillery `ensure` block — test fails if breached) |
| p95 response time | < 500 ms for public GET endpoints |
| Error rate | < 1% (401/404 responses for unauthenticated calls to protected endpoints are expected and do not count as errors) |

### Interpreting Artillery output

Artillery prints a summary table at the end of each run. Key fields to check:

```
http.response_time:
  min: ...    p50: ...    p95: ...    p99: ...    max: ...

http.codes.200: <count>   (successful)
http.codes.401: <count>   (expected — auth-guarded endpoints without token)
http.codes.404: <count>   (expected — test IDs that do not exist in DB)
http.codes.5xx: <count>   (must be 0)
```

A passing run will show `p99 ≤ 2000`, zero 5xx responses, and Artillery will print `All checks OK`.

---

## 4. Testing Environment Configuration

This section describes the environment variables, configuration files, and tooling required to run each layer of the test suite.

### 4.1 Backend test environment

#### Running tests (unit + integration)

Backend tests use `mongodb-memory-server` and do **not require a real MongoDB instance or a `.env` file**. The test runner bootstraps everything it needs in memory.

That said, for running the actual server (required for performance tests), a `.env` file must exist in `server/`. Create one by copying `.env.example`:

```bash
cd server
cp .env.example .env
# then edit .env with real values
```

#### Required environment variables

| Variable | File / module that uses it | Notes |
|----------|---------------------------|-------|
| `MONGO_URI` | `src/config/db.js` | MongoDB Atlas connection string. **Not needed for unit/integration tests** — only for running the live server. |
| `JWT_SECRET` | `src/utils/generateToken.js`, `src/middlewares/auth.middleware.js` | Random string, minimum 32 characters recommended. Used to sign and verify JWTs. |
| `SESSION_SECRET` | `src/server.js` (express-session) | Random string used to sign the session cookie. |
| `PORT` | `src/server.js` | Defaults to **8081** if not set. Performance tests target `http://localhost:8081`. |
| `CLIENT_URL` | `src/server.js` (CORS config) | Frontend origin (e.g. `http://localhost:5173`). Required to allow cross-origin requests from the dev frontend. |
| `EMAIL_USER` | Email controller utilities | Sender address for outbound emails (optional — email tests are mocked). |
| `EMAIL_PASS` | Email controller utilities | SMTP password (optional — email tests are mocked). |
| `TWILIO_*` | WhatsApp notification controller | Twilio credentials for SMS/WhatsApp (optional — mocked in tests). |

#### Jest configuration (`server/jest.config.cjs`)

- `testEnvironment: 'node'` — runs in a Node.js environment (no browser globals).
- `testMatch: ['**/*.test.js']` — picks up all `.test.js` files in both `src/` and `tests/`.
- `--runInBand` flag — runs suites sequentially to prevent race conditions on shared resources (especially the in-memory MongoDB port).
- `setupFilesAfterFramework` sets `testTimeout` to 30 000 ms to accommodate the slower integration tests.

---

### 4.2 Frontend test environment

#### Running tests

```bash
cd client
npm install
npm test
```

No `.env` file is required for frontend tests — all API calls and environment variables are mocked.

#### Key configuration files

| File | Purpose |
|------|---------|
| `client/jest.config.cjs` | Jest configuration: transforms, module aliases, setup files, and manual mock paths |
| `client/babel.config.cjs` | Babel preset for JSX/TypeScript + a custom inline plugin that rewrites `import.meta.env.X` → `process.env.X` so Vite environment variables work under Jest |
| `client/src/setupTests.ts` | Imported before every test: configures `jest-fetch-mock`, adds `@testing-library/jest-dom` matchers, polyfills `window.matchMedia` and `ResizeObserver` |

#### Module aliases and mocks

`jest.config.cjs` maps the `@/` path alias to `src/` and registers manual mocks for modules that cannot run in Jest as-is:

| Mock | Why it is needed |
|------|----------------|
| `client/__mocks__/contexts/adminAuth.js` | Provides stub return values for `useAdminAuth()` so admin pages render without a real auth provider |
| `client/__mocks__/contexts/userApp.js` | Same for `useUserApp()` (patient context) |
| `client/__mocks__/contexts/centerAdmin.js` | Same for `useCenterAdmin()` |
| `client/__mocks__/contexts/labTech.js` | Same for `useLabTech()` |
| `client/__mocks__/contexts/pharmacyAuth.js` | Same for `usePharmacyAuth()` |
| `client/__mocks__/react-router-dom.js` | Lightweight mock providing `MemoryRouter`, `BrowserRouter`, `Link`, `NavLink`, `Outlet`, `Route`, `Routes`, `Navigate`, `useLocation`, `useNavigate`, `useParams`, `useSearchParams` |
| `@/config/api` mock | Prevents `import.meta` evaluation at module load time before Babel can transform it |
| `jspdf` / `jspdf-autotable` | ESM-only libraries — replaced with no-op Jest mocks to avoid parse errors |

#### Important ordering rule

In `jest.config.cjs`, the specific module path entries (`^@/config/api$`, individual context paths) **must appear before** the generic catch-all `^@/(.*)$` → `src/$1` alias. Jest resolves `moduleNameMapper` entries in declaration order, so placing the catch-all first would silently swallow the manual mocks.

---

### 4.3 Performance test environment

Performance tests (Artillery) require a **live server** and therefore need a valid `.env` with at least `MONGO_URI`, `JWT_SECRET`, `SESSION_SECRET`, and `PORT`.

| Requirement | Detail |
|-------------|--------|
| Node.js | 18 or higher |
| Artillery | Installed as devDependency in `server/` (`npm install` covers this) |
| Running server | `cd server && npm run dev` — must respond on `http://localhost:8081/health` before running any perf script |
| MongoDB | A real MongoDB instance (Atlas or local) connected via `MONGO_URI` — in-memory server is only for unit/integration tests |
| Test data | Some tests use known MongoDB ObjectIds (e.g. `000000000000000000000001`). These will return 404 — which is expected and accounted for in the test scripts with multi-status `expect` blocks |

Artillery is invoked via npm scripts in `server/package.json`:

```json
"perf":              "artillery run perf/public-endpoints.yml",
"perf:auth":         "artillery run perf/auth-flow.yml",
"perf:appointments": "artillery run perf/appointment-flow.yml",
"perf:pharmacy":     "artillery run perf/pharmacy-flow.yml",
"perf:all":          "artillery run perf/public-endpoints.yml && ..."
```

Reports can be saved and converted to HTML:

```bash
npx artillery run perf/public-endpoints.yml --output perf/reports/public.json
npx artillery report perf/reports/public.json
# opens an HTML report in the default browser
```

---

## Project Test Summary

| Layer | Type | Tooling | Count | Status |
|-------|------|---------|-------|--------|
| Backend — `server/src/` (colocated) | Unit tests | Jest + mocked dependencies | 27 suites | ✅ All pass |
| Backend — `server/tests/` | Integration tests | Jest + Supertest + mongodb-memory-server | 7 suites | ✅ All pass |
| Backend total | Unit + Integration | `npm test` in `server/` | **~340 tests** | ✅ All pass |
| Frontend — `client/src/` (colocated) | Component / unit tests | Jest + React Testing Library | **132 tests** | ✅ All pass |
| Performance — `server/perf/` | Load tests | Artillery v2.0.30 | 4 scripts | ▶ Requires live server |

