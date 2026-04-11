# Authentication API Documentation

Base URL: `http://localhost:8081`

Summary
- Route groups covered (mounted paths shown):
  - User auth: `/api/auth` (registration, login, logout, profile)
  - Admin auth: `/api/admin/auth` (admin registration, login, logout, admin profile)
- Middleware used in code: `protect` and `allowRoles(...)` for protected endpoints.

---

## Authentication Overview

- Tokens: API uses JWTs (returned at login) — include in requests as `Authorization: Bearer <token>`.
- Middleware:
  - `protect` — requires authenticated user/admin; used for profile and update endpoints.
  - `allowRoles(...)` — restricts admin endpoints to roles like `admin`, `superadmin`, `lab-tech`, `center-admin`.
- Notes:
  - User routes (`/api/auth`) are focused on patient accounts.
  - Admin routes (`/api/admin/auth`) manage admin-level accounts and expose admin profile data.

---

## User Auth (`/api/auth`)

Route base: `/api/auth` (mounted paths discovered in `server/src/server.js`)

### 1) Register Patient
- Method: `POST`
- Endpoint: `/api/auth/register`
- Auth: Not required
- Request body (typical):
  - `fullName` or `name` (string)
  - `email` (string)
  - `phone` (string)
  - `password` (string)

Example:
```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "fullName":"John Doe", "email":"john@example.com", "phone":"+9477...", "password":"Secret123" }'
```

Success `201` (created user + token):
```json
{ "_id":"607f1f...","fullName":"John Doe","email":"john@example.com","token":"<jwt>" }
```

Validation error `400` (e.g., missing password):
```json
{ "message": "Validation failed", "errors": [] }
```

### 2) Login User
- Method: `POST`
- Endpoint: `/api/auth/login`
- Auth: Not required
- Request body:
  - `email` or `phone`
  - `password`

Example:
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email":"john@example.com", "password":"Secret123" }'
```

Success `200`:
```json
{ "_id":"607f1f...","fullName":"John Doe","email":"john@example.com","token":"<jwt>" }
```

Unauthorized `401`:
```json
{ "message": "Invalid credentials" }
```

### 3) Logout User
- Method: `POST`
- Endpoint: `/api/auth/logout`
- Auth: Not required (route exists)

Example:
```bash
curl -X POST http://localhost:8081/api/auth/logout
```

Success `200` (session invalidated or token client-side removal recommended):
```json
{ "message": "Logged out" }
```

### 4) Get Logged-in User Profile
- Method: `GET`
- Endpoint: `/api/auth/me`
- Auth: Required — `protect`

Example:
```bash
curl -X GET http://localhost:8081/api/auth/me \
  -H "Authorization: Bearer <token>"
```

Success `200`:
```json
{ "_id":"607f1f...","fullName":"John Doe","email":"john@example.com","phone":"+9477..." }
```

### 5) Update Logged-in User Profile
- Method: `PATCH`
- Endpoint: `/api/auth/me`
- Auth: Required — `protect`
- Request body: partial profile fields (e.g., `fullName`, `phone`)

Success `200`: returns updated user

### 6) Change Password
- Method: `PATCH`
- Endpoint: `/api/auth/change-password`
- Auth: Required — `protect`
- Request body: `{ "oldPassword": "...", "newPassword": "..." }`

Success `200`:
```json
{ "message": "Password changed" }
```

---

## Admin Auth (`/api/admin/auth`)

Route base: `/api/admin/auth`

### 1) Register Admin
- Method: `POST`
- Endpoint: `/api/admin/auth/register`
- Auth: Not required (route exists)
- Request body (typical): `name`, `email`, `password`, `role` (e.g., `admin`, `superadmin`, `center-admin`, `lab-tech`)

Success `201`:
```json
{ "_id":"60aa...","name":"Admin A","email":"admin@example.com","role":"admin","token":"<jwt>" }
```

### 2) Login Admin
- Method: `POST`
- Endpoint: `/api/admin/auth/login`
- Auth: Not required

Request body: `email`, `password`

Success `200`:
```json
{ "_id":"60aa...","name":"Admin A","email":"admin@example.com","role":"admin","token":"<jwt>" }
```

### 3) Logout Admin
- Method: `POST`
- Endpoint: `/api/admin/auth/logout`

Example:
```bash
curl -X POST http://localhost:8081/api/admin/auth/logout
```

### 4) Get Admin Profile (`me`)
- Method: `GET`
- Endpoint: `/api/admin/auth/me`
- Auth: Required — `protect`, `allowRoles("admin","superadmin","lab-tech","center-admin")`

Success `200`:
```json
{ "_id":"60aa...","name":"Admin A","email":"admin@example.com","role":"admin" }
```

---

## Common Schemas / Fields

- User (patient): `_id`, `fullName`, `email`, `phone`, `roles`, `createdAt`
- Admin: `_id`, `name`, `email`, `role`, `centerId` (for center-admin), `createdAt`
- Auth responses include a `token` (JWT) and basic user/admin data.

---

## Example Error Responses

- Validation error (400):
```json
{ "message": "Validation failed", "errors": [] }
```

- Unauthorized (401):
```json
{ "message": "Invalid credentials" }
```

- Forbidden (403):
```json
{ "message": "Not authorized" }
```

- Server error (500):
```json
{ "message": "<error message>" }
```

---

## Implementation Notes & Recommendations

- Persisted sessions: server uses `express-session` + `connect-mongo` for session storage in addition to JWTs in some flows — consider standardizing on one approach for tokens.
- Protect admin routes and sensitive endpoints with `protect` + `allowRoles(...)`.
- Enforce strong password policy and implement rate limiting on login endpoints.

---