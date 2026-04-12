# Testing Instructions — Health Center

This document covers how to run all tests (backend and frontend) for our Health Center project and explains the testing strategy we followed.

---

## Backend Tests

Our backend has two layers of tests, both run with the same `npm test` command from `server/`.

### 1. Unit tests — colocated in `server/src/`

Unit tests live next to the source file they test (same folder, `.test.js` suffix). Each test mocks all external dependencies (Mongoose models, email utilities, auth/role middlewares) so it exercises only the logic of that one module in isolation.

**Controller unit tests** (`server/src/controllers/`):

| File | What it tests |
|------|---------------|
| `controllers/appoinment/appointmentsController.test.js` | Appointment listing and management logic |
| `controllers/appoinment/appointmentSlotsController.test.js` | Slot generation and query logic |
| `controllers/appoinment/bookingController.test.js` | Booking creation and cancellation logic |
| `controllers/appoinment/diagnosticTest.controller.test.js` | Diagnostic test controller logic |
| `controllers/auth/Doc_adminAuth.controller.test.js` | Doctor / admin authentication logic |
| `controllers/auth/userAuth.controller.test.js` | Patient authentication logic |
| `controllers/doctorChanneling/appointment.controller.test.js` | Doctor channeling appointment controller |
| `controllers/doctorChanneling/center.controller.test.js` | Health center management controller |
| `controllers/doctorChanneling/doctor.controller.test.js` | Doctor profile controller |
| `controllers/doctorChanneling/prescription.controller.test.js` | Prescription controller |
| `controllers/pharmacy/medicationInventoryController.test.js` | Medication inventory controller |
| `controllers/pharmacy/pharmacyOrderController.test.js` | Pharmacy order controller |
| `controllers/TestManagement/testResultController.test.js` | Lab test result controller |
| `controllers/TestManagement/testTypeController.test.js` | Lab test type controller |

**Route unit tests** (`server/src/routes/`):

| File | What it tests |
|------|---------------|
| `routes/appointment/appointmentRoutes.test.js` | Appointment route wiring |
| `routes/appointment/appointmentSlotRoutes.test.js` | Slot route wiring |
| `routes/appointment/diagnosticTest.routes.test.js` | Diagnostic test route wiring |
| `routes/doctorChanneling/admin/adminDoctor.routes.test.js` | Admin doctor route wiring |
| `routes/doctorChanneling/appointment.routes.test.js` | Channeling appointment route wiring |
| `routes/doctorChanneling/center.routes.test.js` | Center route wiring |
| `routes/doctorChanneling/doctor.routes.test.js` | Doctor route wiring |
| `routes/doctorChanneling/prescription.routes.test.js` | Prescription route wiring |
| `routes/doctorChanneling/slot.routes.test.js` | Slot route wiring |
| `routes/pharmacy/medicationInventoryRoutes.test.js` | Medication inventory route wiring |
| `routes/pharmacy/pharmacyOrderRoutes.test.js` | Pharmacy order route wiring |
| `routes/TestManagement/testResultRoutes.test.js` | Test result route wiring |
| `routes/TestManagement/testTypeRoutes.test.js` | Test type route wiring |

### 2. Integration tests — `server/tests/`

Integration tests spin up an **in-memory MongoDB replica set** (`mongodb-memory-server`), mount the real Express routes, and hit them via **Supertest** — exercising the full request → controller → model → database flow. No real MongoDB URI or running server is needed.

| File | APIs / routes covered |
|------|----------------------|
| `tests/appointment.test.js` | Appointment booking (`/api/bookappointment`, `/api/appointment/:id`, …) and slot management (`/api/generateSlots`, `/api/getSlots`, …) |
| `tests/diagnosticTest.test.js` | Diagnostic test CRUD (`/api/lab/diagnostic-tests`) |
| `tests/medicationInventory.test.js` | Pharmacy medication inventory (`/api/pharmacy/medications`) |
| `tests/pharmacyOrder.test.js` | Pharmacy order processing and invoice flow |

External dependencies (email service, auth/role middlewares) are Jest-mocked so tests run fully offline.

### How to run all backend tests

```bash
cd server
npm install
npm test
```

All test files (unit + integration) are picked up by Jest and run in-band (`--runInBand`).

**Current results:** 31 test suites, 317 tests — all passing.

### Coverage report

```bash
cd server
npm run test:coverage
```

HTML report is generated at `server/coverage/index.html`. Open it in a browser to see per-file line/branch coverage.

### Environment variables

Backend tests use `mongodb-memory-server` so **no real MongoDB URI is needed**. For running the actual server locally:

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string (used by `src/config/db.js`) |
| `JWT_SECRET` | JWT signing secret used in `src/utils/generateToken.js` and `src/middlewares/auth.middleware.js` |
| `SESSION_SECRET` | Express session secret (used in `src/server.js`) |
| `PORT` | Backend listen port — defaults to **8081** |

---

## Frontend Tests

Our frontend test suite lives colocated next to each component/page (e.g., `src/components/DoctorCard.test.jsx`) and uses **Jest**, **React Testing Library**, and **jest-dom**.

### Test locations

Tests are colocated with their source files in:
- `client/src/components/` — reusable components (AppointmentCard, DoctorCard, ProductCard, SlotPicker, StatusBadge, Navbar, Footer, …)
- `client/src/components/ui/` — all Shadcn/Radix UI primitives (Button, Card, Input, Dialog, Toast, Sidebar, …)
- `client/src/pages/` — all page-level components across all roles (admin, center-admin, doctor, lab-tech, pharmacy, user, public)
- `client/src/layouts/` — AdminLayout, UserLayout, DoctorLayout, LabTechLayout, etc.
- `client/src/routes/` — AdminRoutes, UserRoutes, DoctorRoutes, etc.
- `client/src/hooks/` — use-toast, use-mobile
- `client/src/lib/` — api, slotUtils, utils

### How to run

```bash
cd client
npm install
npm test
```

To run in watch mode during development:

```bash
npm run test:watch
```

**Current results:** 127 test suites, 132 tests — all passing.

### Key technical setup notes

- **Babel config** (`babel.config.cjs`) includes a custom plugin that rewrites `import.meta.env` → `process.env` so Vite-specific environment variables work under Jest.
- **jest.config.cjs** maps the `@/` path alias to `src/` and provides manual mocks for:
  - Context providers (`AdminAuthContext`, `UserAppContext`, `CenterAdminContext`, `LabTechContext`, `PharmacyAuthContext`) — so components render without needing real auth state
  - `@/config/api` — avoids `import.meta` at module load time
  - `jspdf` / `jspdf-autotable` — avoids ESM-only PDF library syntax in test builds
  - `react-router-dom` — lightweight mock covering all hooks (`useNavigate`, `useLocation`, `useParams`, `useSearchParams`)
- **setupTests.ts** configures `jest-fetch-mock`, `@testing-library/jest-dom`, a `matchMedia` polyfill, and a `ResizeObserver` polyfill.

---

## Project Test Summary

| Area | Type | Framework | Test count | Status |
|------|------|-----------|-----------|--------|
| Backend unit — `server/src/` (colocated) | Unit tests | Jest (mocked dependencies) | — | ✅ All pass |
| Backend integration — `server/tests/` | Integration tests | Jest + Supertest + mongodb-memory-server | — | ✅ All pass |
| Backend total | Unit + Integration | Jest (`npm test` in `server/`) | **317 tests** | ✅ All pass |
| Frontend — `client/src/` (colocated) | Unit / component tests | Jest + React Testing Library | **132 tests** | ✅ All pass |

