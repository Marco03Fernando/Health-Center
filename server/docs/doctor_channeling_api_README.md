# Doctor Channeling API Documentation (Centers, Doctors, Slots, Appointments, Prescriptions)

Base URL: `http://localhost:8081`

Summary
- Route groups covered (mounted paths shown):
	- Centers: `/api/centers` and admin paths under `/api/centers/admin`
	- Doctors: `/api/doctors` and admin doctor management under `/api/admin/doctors`
	- Slots: `/api/slots` (query-based)
	- Appointments (channeling bookings): `/api/appointments`
	- Prescriptions: `/api/prescriptions`
- Auth middleware used in code: `protect`, `allowRoles(...)`, and `protectDoctorRoute` for doctor-specific endpoints.

---

## Authentication

- Middleware used: `protect`, `allowRoles(...)`, `protectDoctorRoute`.
- Common role values seen in routes: `doctor`, `patient`, `pharmacy`, `admin`, `superadmin`.
- Notes:
	- Prescription creation is restricted to `doctor` role.
	- Some doctor-specific endpoints use `protectDoctorRoute` to validate the logged-in doctor.
	- Center admin endpoints require `admin` or `superadmin`.

---

## Centers API

Route base: `/api/centers`

### 1) List Public Centers
- Method: `GET`
- Endpoint: `/api/centers`
- Auth: Not required

Example:
```bash
curl -X GET http://localhost:8081/api/centers
```

Response `200`:
```json
[
	{ "_id":"60a...","name":"Downtown Health Center","address":"123 Main St","isActive":true }
]
```

### 2) Get Featured Centers
- Method: `GET`
- Endpoint: `/api/centers/featured`
- Auth: Not required

### 3) Admin: Get All Centers
- Method: `GET`
- Endpoint: `/api/centers/admin/all`
- Auth: Required — `protect`, `allowRoles("admin", "superadmin")`

### 4) Admin: Create / Update / Toggle
- Create: `POST /api/centers/admin` — `protect`, `allowRoles("admin","superadmin")`
- Update: `PATCH /api/centers/admin/:id` — `protect`, `allowRoles("admin","superadmin")`
- Toggle active: `PATCH /api/centers/admin/:id/active`
- Toggle featured: `PATCH /api/centers/admin/:id/featured`

Request body example (create):
```json
{ "name":"Downtown Health Center", "address":"123 Main St", "phone":"+9477...", "isActive":true }
```

Success `201` (created) / `200` (updated): returns center object

---

## Doctors API

Route base: `/api/doctors` and admin paths under `/api/admin/doctors`

### 1) List Doctors (public)
- Method: `GET`
- Endpoint: `/api/doctors`
- Auth: Not required

Example response `200`:
```json
[
	{ "_id":"61d...","name":"Dr. Alice","specialty":"Cardiology","centerId":"60a..." }
]
```

### 2) Get Doctor By ID
- Method: `GET`
- Endpoint: `/api/doctors/:id`
- Auth: Not required

### 3) Doctor Profile (logged-in doctor)
- Method: `GET`
- Endpoint: `/api/doctors/me`
- Auth: Required — `protectDoctorRoute`

Success `200`:
```json
{ "_id":"61d...","name":"Dr. Alice","centerId":"60a...","startTime":"09:00","endTime":"13:00","sessionTime":15 }
```

### 4) Update Doctor Profile (logged-in doctor)
- Method: `PATCH`
- Endpoint: `/api/doctors/me`
- Auth: Required — `protectDoctorRoute`
- Request body: partial profile fields (e.g., `startTime`, `endTime`, `sessionTime`, `workingDays`)

Example update:
```bash
curl -X PATCH http://localhost:8081/api/doctors/me \
	-H "Authorization: Bearer <doctor-token>" \
	-H "Content-Type: application/json" \
	-d '{"startTime":"08:30","endTime":"12:30","sessionTime":20}'
```

---

## Slots API

Route base: `/api/slots`

### 1) Query Available Slots
- Method: `GET`
- Endpoint: `/api/slots?doctorId=<id>&date=YYYY-MM-DD`
- Auth: Not required
- Query params:
	- `doctorId` (required)
	- `date` (required) — format `YYYY-MM-DD`

Example request:
```bash
curl -X GET "http://localhost:8081/api/slots?doctorId=61d...&date=2026-04-15"
```

Success `200`:
```json
{ "success": true, "data": [ { "_id":"612a...","startTime":"09:00","endTime":"09:15","isBooked":false } ] }
```

Behavior and notes:
- Slots are created by a rolling slot maintenance job using each doctor's schedule (`startTime`, `endTime`, `sessionTime`, `workingDays`).
- Clients should respect `isBooked` flag to avoid double booking; booking endpoints will set `isBooked=true` when confirmed.

---

## Appointments (Channeling) API

Route base: `/api/appointments`

### 1) Create Appointment (book slot)
- Method: `POST`
- Endpoint: `/api/appointments`
- Auth: Not required (booking by guest/user allowed)
- Request body (example):
```json
{
	"userId": "607f1f...", 
	"centerId": "60a...",
	"doctorId": "61d...",
	"slotId": "612a...",
	"patient": { "name":"John Doe","phone":"+9477..." },
	"notes": "Follow-up"
}
```

Success `201`:
```json
{ "_id":"61b9...","centerId":"60a...","doctorId":"61d...","slotId":"612a...","status":"BOOKED","patient":{"name":"John Doe"} }
```

Conflict `409` (slot already booked):
```json
{ "message": "Slot already booked" }
```

### 2) List Appointments For User
- Method: `GET`
- Endpoint: `/api/appointments/user/:userId`
- Auth: Not required (controller filters to user where appropriate)

Example `200`:
```json
[{ "_id":"61b9...","centerId":"60a...","slotId":"612a...","status":"BOOKED" }]
```

### 3) List Appointments For Logged-in Doctor
- Method: `GET`
- Endpoint: `/api/appointments/doctor/me`
- Auth: Required — `protectDoctorRoute`

Returns appointments assigned to the doctor (queryable by date in controller where implemented).

### 4) Doctor Updates Appointment Status
- Method: `PATCH`
- Endpoint: `/api/appointments/:id/status`
- Auth: Required — `protectDoctorRoute`
- Request body example: `{ "status": "COMPLETED" }` or `{ "status": "NO_SHOW" }`

Success `200` returns updated appointment

### 5) Cancel Appointment
- Method: `DELETE`
- Endpoint: `/api/appointments/:id/cancel`
- Auth: Not required
- Behavior: marks appointment cancelled and frees the slot (controller handles freeing `isBooked`)

Success `200`:
```json
{ "message": "Appointment cancelled" }
```

---

## Prescriptions API

Route base: `/api/prescriptions`

### 1) List Prescriptions (patient can only see own; controller enforces)
- Method: `GET`
- Endpoint: `/api/prescriptions`
- Auth: Required — `protect`, `allowRoles("doctor","patient","pharmacy","admin","superadmin")`

Example `200`:
```json
[{ "_id":"60f...","doctorId":"61d...","patientId":"607f...","createdAt":"..." }]
```

### 2) Create Prescription (Doctor only)
- Method: `POST`
- Endpoint: `/api/prescriptions`
- Auth: Required — `protect`, `allowRoles("doctor")`
- Request body example:
```json
{ "patientId":"607f...","centerId":"60a...","medications":[{"name":"Paracetamol","qty":10}],"notes":"Take after food" }
```

Success `201` returns created prescription

### 3) Download Prescription PDF
- Method: `GET`
- Endpoint: `/api/prescriptions/:id/pdf`
- Auth: Required — `protect`, `allowRoles("doctor","patient","pharmacy","admin","superadmin")`

Response: PDF stream (Content-Type: `application/pdf`)

### 4) Get Prescription By ID
- Method: `GET`
- Endpoint: `/api/prescriptions/:id`
- Auth: Required — `protect`, `allowRoles("doctor","patient","pharmacy","admin","superadmin")`

Example `200` returns prescription object

### 5) Pharmacy Dispense Mark
- Method: `PATCH`
- Endpoint: `/api/prescriptions/:id/dispense`
- Auth: Required — `protect`, `allowRoles("pharmacy","admin","superadmin")`
- Behavior: marks prescription as dispensed for downstream pharmacy fulfillment and may trigger pharmacy order flows.

Success `200`:
```json
{ "message": "Prescription marked dispensed" }
```

---

## Common Schemas / Important Fields

- Center: `_id`, `name`, `address`, `phone`, `isActive`, `isFeatured`
- Doctor: `_id`, `name`, `specialty`, `centerId`, `startTime`, `endTime`, `sessionTime`, `workingDays`, `holidayDates`, `isActive`
- Slot: `_id`, `doctorId`, `centerId`, `date`, `startTime`, `endTime`, `isBooked`, `isActive`
- Appointment: `_id`, `userId`, `centerId`, `doctorId`, `slotId`, `status` (`BOOKED`,`CANCELLED`,`COMPLETED`,`NO_SHOW`), `patient`, `notes`, `createdAt`
- Prescription: `_id`, `doctorId`, `patientId`, `centerId`, `medications`, `notes`, `createdAt`, `status`, PDF stream available via `/pdf`

---

## Error Responses (examples)

- Validation error (400):
```json
{ "message": "Validation failed", "errors": [] }
```

- Not found (404):
```json
{ "message": "Resource not found" }
```

- Unauthorized (401) / Forbidden (403):
```json
{ "message": "Not authorized" }
```

- Server error (500):
```json
{ "message": "<error message>" }
```

---

## Implementation Notes & Behaviors

- Slots are generated by a daily maintenance job using doctor schedules; regenerating slots should check duplicates.
- Booking an appointment sets the slot `isBooked` flag to prevent double-booking; controllers use optimistic checks and return `409` if already booked.
- `protectDoctorRoute` is used to verify the caller is the doctor associated with the requested resource (e.g., doctor `/me` endpoints and status updates).
- Prescription PDF generation streams a PDF response — clients should request with `Accept: application/pdf` where appropriate.
- Admin doctor management endpoints live under `/api/admin/doctors` (see admin routes) and require `admin`/`superadmin` roles.

---