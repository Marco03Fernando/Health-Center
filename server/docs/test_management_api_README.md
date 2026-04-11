# Test Management API Documentation (Test Types & Test Results)

Base URL: `http://localhost:8081`

Summary
- Route groups covered:
  - Test Types (catalog): `/api/test-types`
  - Test Results (create, retrieve, notifications, PDF): `/api/test-results`
- Middleware observed: controller code runs without route-level auth in routes; controllers sometimes validate IDs and inputs. Notification helpers are used for WhatsApp/email deliveries.

---

## Authentication

- Current routes do not attach `protect`/`allowRoles` at the route level (see `server/src/routes/TestManagement/*`). In production, restrict create/update/delete/resend endpoints to authorized staff.

---

## Test Types (Catalog)

Route base: `/api/test-types`

### 1) Create Test Type
- Method: `POST`
- Endpoint: `/api/test-types`
- Auth: Not required in current code (recommend `protect` + `allowRoles('admin','superadmin')`)
- Request body fields (primary):
  - `testCode` (string, required) — unique code
  - `name` (string, required)
  - `description` (string)
  - `category` (string)
  - `price` (number)
  - `sampleTypes` (string or array)
  - `instructions` (string)
  - `parameters` (array of parameter defs)
  - `availableDoctors` (array of doctor ids)
  - `centerId` (optional)

Request example:
```bash
curl -X POST http://localhost:8081/api/test-types \
  -H "Content-Type: application/json" \
  -d '{
    "testCode":"CBC-001",
    "name":"Complete Blood Count",
    "description":"Full blood count",
    "price":1200,
    "sampleTypes":"blood",
    "parameters":[{"name":"Hemoglobin","unit":"g/dL","normalMinValue":12,"normalMaxValue":16}]
  }'
```

Success response `201`:
```json
{
  "_id":"5f1a2b...",
  "testCode":"CBC-001",
  "name":"Complete Blood Count",
  "price":1200,
  "parameters":[{"name":"Hemoglobin","unit":"g/dL","normalMinValue":12,"normalMaxValue":16}]
}
```

Duplicate code/name returns `400` with message `Test code or name already exists`.

### 2) Get All Test Types
- Method: `GET`
- Endpoint: `/api/test-types`
- Query params: `centerId` (optional) to filter by center

Example:
```bash
curl -X GET "http://localhost:8081/api/test-types?centerId=60a..."
```

Success `200`: array of test type objects.

### 3) Get Test Type By ID
- Method: `GET`
- Endpoint: `/api/test-types/:id`

Success `200`: single test type object

Not found `404`:
```json
{ "message": "Test Type not found" }
```

### 4) Update Test Type
- Method: `PUT`
- Endpoint: `/api/test-types/:id`
- Request body: partial updates allowed

Success `200`: updated test type object

### 5) Delete Test Type
- Method: `DELETE`
- Endpoint: `/api/test-types/:id`

Success `200`:
```json
{ "message": "Test Type deleted successfully" }
```

---

## Test Results

Route base: `/api/test-results`

Notes: Test Results are stored in `TestManagement/TestResult` model and are often associated with an `appointmentId` (booking), `patientId`, and `testTypeId`.

### 1) Create Test Result
- Method: `POST`
- Endpoint: `/api/test-results`
- Auth: Not required in current routes (recommend protect for lab staff)
- Request body (typical fields):
  - `appointmentId` (ObjectId) — optional link to appointment/booking
  - `patientId` (ObjectId) — patient reference
  - `testTypeId` (ObjectId) — diagnostic test type
  - `status` (string) — e.g., `PENDING`, `COMPLETED`
  - `results` (array) — parameter results: `{ name, value, unit, normalMinValue, normalMaxValue }`
  - `notes`, `condition`, `recommendConsultation` (booleans)

Example request:
```bash
curl -X POST http://localhost:8081/api/test-results \
  -H "Content-Type: application/json" \
  -d '{
    "patientId":"607f1f...",
    "testTypeId":"5f1a2b...",
    "appointmentId":"61b9...",
    "status":"COMPLETED",
    "results":[{"name":"Hemoglobin","value":13.5,"unit":"g/dL","normalMinValue":12,"normalMaxValue":16}]
  }'
```

Success `201`:
```json
{
  "success": true,
  "message": "Test result created successfully",
  "data": { /* populated test result object */ },
  "notifications": { "whatsapp": {...}, "email": {...} }
}
```

Behavior:
- After create the controller populates related references and triggers `notifyTestResultCreated` which can send WhatsApp and Email notifications (non-blocking). The response includes notification results.

### 2) Get All Test Results
- Method: `GET`
- Endpoint: `/api/test-results`
- Query params: `centerId` (optional) — server maps centerId to appointment booking ids to filter results

Success `200`:
```json
{ "success": true, "data": [ /* array of populated test results */ ] }
```

### 3) Get Test Results By Patient
- Method: `GET`
- Endpoint: `/api/test-results/patient/:patientId`
- Auth: Not required in routes (controller validates `patientId` type)

Success `200` returns array of patient's test results

### 4) Get Test Result By ID
- Method: `GET`
- Endpoint: `/api/test-results/:id`

Success `200`:
```json
{ "success": true, "data": { /* populated result */ } }
```

Not found `404`:
```json
{ "success": false, "error": "Not found" }
```

### 5) Update Test Result
- Method: `PUT`
- Endpoint: `/api/test-results/:id`
- Request body: partial fields to update (e.g., `status`, `results`, `notes`)

Success `200`:
```json
{ "success": true, "data": { /* updated test result */ } }
```

### 6) Delete Test Result
- Method: `DELETE`
- Endpoint: `/api/test-results/:id`

Success `200`:
```json
{ "success": true, "data": {} }
```

---

## PDF and Notification Endpoints

### 1) Generate PDF for Test Result
- Method: `GET`
- Endpoint: `/api/test-results/:id/pdf`
- Response: streams a generated PDF (Content-Type `application/pdf`)

Behavior:
- The controller builds a polished PDF using `pdfkit`, embedding patient, appointment, test meta, and a results table with flags (Low/Normal/High) based on parameter ranges.

### 2) Resend WhatsApp Notification
- Method: `POST`
- Endpoint: `/api/test-results/:id/send-whatsapp`
- Behavior: repopulates the test result and calls `notifyTestResultCreated` with `sendWhatsapp: true`; returns WhatsApp delivery result or error.

### 3) Resend Email Notification
- Method: `POST`
- Endpoint: `/api/test-results/:id/send-email`

Behavior: similar to WhatsApp resend but for email; returns `email.messageId` on success.

Example resend request:
```bash
curl -X POST http://localhost:8081/api/test-results/61b9.../send-email
```

Success `200` (email):
```json
{ "success": true, "message": "Email sent successfully", "emailMessageId": "<id>" }
```

Failure `400` if contact missing (e.g., no patient email/phone):
```json
{ "success": false, "error": "Patient email not found" }
```

---

## Schemas / Important Fields

- TestType (DiagnosticTest): `_id`, `testCode`, `name`, `description`, `category`, `price`, `sampleTypes`, `parameters` (array)
- TestResult: `_id`, `testTypeId`, `patientId`, `appointmentId`, `status`, `results` (array of `{ name, value, unit, normalMinValue, normalMaxValue }`), `condition`, `recommendConsultation`, `notes`, `createdAt`

---

## Example Error Responses

- Validation error (400):
```json
{ "success": false, "error": "Invalid patient ID" }
```

- Not found (404):
```json
{ "success": false, "error": "Test result not found" }
```

- Server error (500):
```json
{ "success": false, "error": "<error message>" }
```

---

## Implementation Notes & Behaviors

- Creation: controllers populate related references (`testTypeId`, `appointmentId`, `patientId`) before returning results.
- Notifications: `notifyTestResultCreated` attempts WhatsApp and email deliveries; failures are returned in `notifications` but do not prevent saving the result.
- PDF: generated via `pdfkit` with helper renderers; endpoint streams the PDF and sets `Content-Disposition` for inline viewing.
- Filtering: `getAllTestResults` supports a `centerId` query; server maps to related bookings to filter results by center.

---