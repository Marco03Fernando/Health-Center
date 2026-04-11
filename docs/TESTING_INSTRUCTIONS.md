# Testing Instructions — Health Center

This file contains testing commands and project-specific testing placeholders. Only verified project details are included; unknown values are marked as <placeholder>.

1) Unit tests

- How to run (project):

```bash
cd server
npm install
npm test
```

- Notes: the backend `server/package.json` defines `test` which runs the Jest test suite.

2) Integration tests

- Project facts:
  - The repository includes `supertest` and `jest` as devDependencies in `server/package.json`.
  - The backend connects to MongoDB using `process.env.MONGO_URI` (see `server/src/config/db.js`).

- Placeholder / required values before running integration tests:
  - Test DB connection string: `<TEST_MONGO_URI or MONGO_URI>`
  - `NODE_ENV` for tests: `<placeholder: NODE_ENV=test if used>`

- How to run (example placeholder):

```bash
cd server
# set test DB connection (replace placeholder)
export TEST_MONGO_URI="<your-test-mongo-uri>"
export NODE_ENV="test"
# run integration tests if a separate script exists, otherwise run `npm test`
npm test
```

3) Performance testing

- Project facts: no performance testing scripts are committed to the repository.
- Placeholder: add performance scripts or tools as needed (e.g., Artillery, k6). Report file: `docs/perf/REPORT-<timestamp>.md` (placeholder).

4) Coverage report

- How to generate (project):

```bash
cd server
npm run test:coverage
```

- Placeholder for coverage report file/location: `docs/coverage/coverage-summary.txt` (create after running coverage).

5) Environment variables (truthful project keys/names)

- `MONGO_URI` — used by `server/src/config/db.js` for DB connection
- `SESSION_SECRET` — used by `server/src/server.js` for session middleware (may be set as `SESSION_SECRET` or `process.env.SESSION_SECRET`)
- `PORT` — server listens on `process.env.PORT` (default 8081)

6) Test artifacts / placeholders added to repo

- `docs/coverage/` — placeholder directory for coverage output (file: `coverage-summary.txt`) 
- `docs/perf/` — placeholder directory for performance reports

---

If you want, I will commit the two placeholder folders (`docs/coverage/` and `docs/perf/`) and a README in each describing expected files.
