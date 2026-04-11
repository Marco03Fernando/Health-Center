# <Health_Center> (MERN)

## Overview
This is a project for 3YS1 Application Frameworks module code IT3040. Web application for a rural health center booking management

## Structure
- `client/` - React frontend
- `server/` - Express backend
## Server API documentation files

Detailed API documentation for server modules is available under `server/docs/` (pharmacy first):

- `server/docs/pharmacy_api_README.md` - Pharmacy (medication inventory, orders)
- `server/docs/appointment_api_README.md` - Appointments, slots, diagnostic tests
- `server/docs/doctor_channeling_api_README.md` - Centers, doctors, prescriptions, channeling appointments
- `server/docs/test_management_api_README.md` - Test types and test results (PDF / messaging)
- `server/docs/auth_api_README.md` - Authentication endpoints (register/login/me)

## Setup Instructions (Server)

Follow these steps from the repository root to run the server locally:

1. Prerequisites
	- Node.js 16+ and npm installed
	- MongoDB accessible (local or remote)

2. Install dependencies
```bash
cd server
npm install
```

3. Configure environment
	- Copy `.env.example` to `.env` or create a `.env` file with at least:
	  - `MONGO_URI` (MongoDB connection string)
	  - `PORT` (e.g. `8081`)
	  - `JWT_SECRET`
	  - Email / Twilio credentials if used by your environment

4. Run in development
```bash
npm run dev
```
The dev script runs `nodemon src/server.js`. The docs assume the server is available at `http://localhost:8081`.

5. Run tests
```bash
npm test
```

6. Notes
	- Protected routes require the `Authorization: Bearer <token>` header (middleware: `protect`, `allowRoles`).
	- If you change the server `PORT`, update Base URLs inside the files under `server/docs/`.

## Contributing
See `CONTRIBUTING.md`.
