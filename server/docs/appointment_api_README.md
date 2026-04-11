# Appointment API Documentation (Booking, Slots, Diagnostic Tests)

Base URL: `http://localhost:8081`

Summary
- Route groups covered:
  - Booking (route base: `/api/bookappointment`, `/api/appointment/:bookingId`, `/api/user-appointments/:userId`)
  - Appointment Slots (route base: `/api/generateSlots`, `/api/getSlots`, etc.)
  - Diagnostic Tests (route base: `/api/` under the diagnostic tests router)
- Auth middleware used in code: `protect` and `allowRoles(...)` where present in routes.

---

## Authentication

- Middleware used in code: `protect`, `protectDoctorRoute`, `allowRoles(...)`.
- Notes:
  - Many booking and slot endpoints are public in current routes; some admin/doctor endpoints require auth.
  - When required, include `Authorization: Bearer <token>` header.

---

## Booking API

Route base (router): `server/src/routes/appointment/appointmentRoutes.js`

### 1) Create Booking
- Method: `POST`
- Endpoint: `/api/bookappointment`
- Auth: Not required
- Request body (required/optional fields):
  - `userId` (string) — optional when booking for guest; used for user history
  - `centerId` (string, required) — center id hosting the appointment
  - `slotId` (string, required) — slot id to reserve
  - `services` (array) — optional list of diagnostic services/test ids
  - `patient` (object) — `{ name, phone, email }` (name required)
  - `notes` (string) — optional

Request example:
```bash
curl -X POST http://localhost:8081/api/bookappointment \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"607f1f...",
    "centerId":"60af...",
    "slotId":"612a...",
    "patient": { "name":"John Doe", "phone":"+94771234567" }
  }'
```

Success response `201` (booking created):
```json
{
  "_id": "61b9abcd1234",
  "userId": "607f1f...",
  "centerId": "60af...",
  "slotId": "612a...",
  "status": "BOOKED",
  "patient": { "name": "John Doe", "phone": "+94771234567" },
  "services": [],
  "notes": "",
  "createdAt": "2026-04-11T08:00:00.000Z"
}
```

Validation error `400` (missing required fields):
```json
{ "message": "Validation failed", "errors": [{ "msg": "centerId is required", "param": "centerId" }] }
```

Conflict error `409` (slot already booked):
```json
{ "message": "Slot already booked" }
```

### 2) Get Booking By ID
- Method: `GET`
- Endpoint: `/api/appointment/:bookingId`
- Auth: Not required

Example request:
```bash
curl -X GET http://localhost:8081/api/appointment/61b9abcd1234
```

Success `200`:
```json
{
  "_id": "61b9abcd1234",
  "userId": "607f1f...",
  "centerId": "60af...",
  "slotId": "612a...",
  "status": "BOOKED",
  "patient": { "name":"John Doe", "phone":"+94771234567" }
}
```

Not found `404`:
```json
{ "message": "Booking not found" }
```

### 3) Get User Bookings
- Method: `GET`
- Endpoint: `/api/user-appointments/:userId`
- Auth: Not required

Example request:
```bash
curl -X GET http://localhost:8081/api/user-appointments/607f1f...
```

Success `200` (array):
```json
[
  { "_id":"61b9abcd1234", "centerId":"60af...", "status":"BOOKED", "createdAt":"2026-04-11T08:00:00.000Z" }
]
```

### 4) Update Booking
- Method: `PUT`
- Endpoint: `/api/updateappointment/:bookingId`
- Auth: Not required (current routes)
- Notes: controllers accept partial updates; allowed fields include `notes`, `status`, `patient` info, and `services`.

Request example (update notes/status):
```bash
curl -X PUT http://localhost:8081/api/updateappointment/61b9abcd1234 \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Arriving 10 minutes late", "status": "CONFIRMED" }'
```

Success `200` (updated booking):
```json
{ "_id":"61b9abcd1234", "notes":"Arriving 10 minutes late", "status":"CONFIRMED" }
```

Validation error `400` example:
```json
{ "message": "Validation failed", "errors": [{ "msg":"Invalid status", "param":"status" }] }
```

### 5) Delete Booking (Cancel)
- Method: `DELETE`
- Endpoint: `/api/deleteappointment/:bookingId`
- Auth: Not required
- Behavior: marks booking cancelled and frees slot (controller sets status and possibly updates slot `isBooked`)

Example request:
```bash
curl -X DELETE http://localhost:8081/api/deleteappointment/61b9abcd1234
```

Success `200`:
```json
{ "message": "Booking cancelled" }
```

Not found `404`:
```json
{ "message": "Booking not found" }
```

### 6) Center & Admin Lists
- GET `/api/getappointments/:centerId` — bookings for a center (returns array; may support query params)
- GET `/api/getallappointments` — admin list (returns all bookings)

Example center list `200`:
```json
[
  { "_id":"61b9...", "userId":"607f...", "slotId":"612a...", "status":"BOOKED" }
]
```

---

## Appointment Slots API

Route base: `server/src/routes/appointment/appointmentSlotRoutes.js`

### 1) Generate Slots
- Method: `POST`
- Endpoint: `/api/generateSlots`
- Auth: Not required
- Request body (example):
```json
{
  "centerId": "60af...",
  "doctorId": "61aa...",
  "dateFrom": "2026-04-15",
  "dateTo": "2026-04-20",
  "startTime": "09:00",
  "endTime": "12:00",
  "slotDurationMinutes": 15
}
```

Success response `201`:
```json
[
  { "_id":"612a...","date":"2026-04-15","startTime":"09:00","endTime":"09:15","isBooked":false }
]
```

Validation error `400`:
```json
{ "message": "Validation failed", "errors": [{ "msg":"dateFrom is required", "param":"dateFrom" }] }
```

### 2) Update Slot
- Method: `PUT`
- Endpoint: `/api/updateSlot/:id`
- Request body: partial slot fields (e.g., `{ "isBooked": true }`)

Success `200`: updated slot object

### 3) Get Slots
- Method: `GET`
- Endpoint: `/api/getSlots` — returns all slots
- Method: `GET`
- Endpoint: `/api/getSlotsByCenter/:centerId` — returns center slots
- Method: `GET`
- Endpoint: `/api/getAvailableAppointmentSlots/:centerId` — returns unbooked slots

Example `200`:
```json
[{ "_id":"612a...","date":"2026-04-15","startTime":"09:00","isBooked":false }]
```

### 4) Delete / Cleanup Slots
- DELETE `/api/deleteSlot/:id` — remove a slot
- DELETE `/api/deleteExpiredUnbooked` — remove past unbooked slots
- DELETE `/api/deleteUpcomingUnbooked` — remove future unbooked slots per business rule

Success `200`:
```json
{ "message": "Slots deleted" }
```

---

## Diagnostic Tests (Catalog)

Route base: `server/src/routes/appointment/diagnosticTest.routes.js`

### 1) List Tests
- Method: `GET`
- Endpoint: `/api/` (router base)
- Response `200`: array of tests

Example response:
```json
[
  { "_id":"5f1a...","name":"Complete Blood Count","code":"CBC","price":1200 }
]
```

### 2) Get Test By ID
- Method: `GET`
- Endpoint: `/api/:id`

Success `200`:
```json
{ "_id":"5f1a...","name":"Complete Blood Count","code":"CBC","price":1200 }
```

Not found `404`:
```json
{ "message": "Test not found" }
```

### 3) Create Test
- Method: `POST`
- Endpoint: `/api/`
- Auth: Not required in routes (use admin in production)
- Request body example:
```json
{ "name": "Complete Blood Count", "code": "CBC", "description": "Full blood count", "price": 1200 }
```

Success `201`:
```json
{ "_id":"5f1a...","name":"Complete Blood Count","code":"CBC","price":1200 }
```

Validation error `400`:
```json
{ "message": "Validation failed", "errors": [{ "msg":"name is required", "param":"name" }] }
```

### 4) Update Test
- Method: `PUT`
- Endpoint: `/api/:id`
- Request body: partial updates

Success `200`: updated test object

### 5) Delete Test
- Method: `DELETE`
- Endpoint: `/api/:id`

Success `200`:
```json
{ "message": "Test deleted" }
```

---

## Schemas / Important Fields

- Booking object:
  - `_id`, `userId`, `centerId`, `slotId`, `status` (e.g., `BOOKED`, `CANCELLED`), `patient`, `services`, `notes`, `createdAt`, `updatedAt`

- Slot object:
  - `_id`, `centerId`, `doctorId`, `date`, `startTime`, `endTime`, `isBooked`, `bookedBy`, `createdAt`

- Diagnostic Test object:
  - `_id`, `name`, `code`, `description`, `price`, `isActive`

---

## Example Error Responses

- Validation error (400):
```json
{ "message": "Validation failed", "errors": [] }
```

- Not found (404):
```json
{ "message": "Booking not found" }
```

- Server error (500):
```json
{ "message": "<error message>" }
```

---

## Implementation Notes & Behaviors

- Booking creation typically marks a slot's `isBooked` flag and prevents double-booking.
- Slot generation can create many slots in a date range; ensure duplicate checks when regenerating.
- Diagnostic test CRUD is simple; related test-result handling lives in the TestManagement module.

---