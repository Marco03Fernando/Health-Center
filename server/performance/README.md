# Backend Performance Testing — Artillery

This folder contains all performance tests for the Health Center Node.js API.  
The tests use **[Artillery](https://www.artillery.io/)** — a modern, YAML-driven load-testing tool.

---

## Folder Structure

```
server/performance/
├── artillery.base.yml           ← Shared base config (target URL, phases, plugins)
├── run-all.js                   ← Script to run every test and generate HTML reports
├── reports/                     ← Auto-created; stores .json and .html outputs
└── tests/
    ├── auth.user.yml            ← POST /api/auth/register  |  POST /api/auth/login  |  GET /api/auth/me
    ├── auth.admin.yml           ← POST /api/admin/auth/login  |  GET /api/admin/auth/me
    ├── doctors.yml              ← GET /api/doctors  |  GET /api/doctors/:id  |  GET /api/slots
    ├── centers.yml              ← GET /api/centers  |  GET /api/centers/:id
    ├── appointments.doctor-channeling.yml  ← POST/GET/DELETE /api/appointments
    ├── appointments.lab.yml     ← POST/GET /api/bookappointment  |  /api/getallappointments
    ├── test-types.yml           ← GET/POST /api/test-types
    ├── test-results.yml         ← GET/POST/PUT /api/test-results
    └── pharmacy.yml             ← GET/POST /api/medications  |  /api/pharmacy-orders
```

---

## Step 1 — Install Artillery

Run this command inside the **`server/`** folder:

```bash
cd server
npm install --save-dev artillery artillery-plugin-metrics-by-endpoint
```

> `artillery-plugin-metrics-by-endpoint` groups stats **per URL** in the report  
> so you can identify which specific endpoint is slow.

---

## Step 2 — Start Your Server

Make sure the API server is running before you launch tests:

```bash
# From the server/ directory:
npm run dev
# Server should start on http://localhost:8081
```

---

## Step 3 — Replace Placeholder IDs

Several test files contain `REPLACE_WITH_REAL_*` placeholder values.  
These must be real MongoDB ObjectIds from your database. Open each `.yml` file  
and update the `variables:` section at the top before running.

**Example** — in `doctors.yml`:
```yaml
variables:
  doctorId: "REPLACE_WITH_REAL_DOCTOR_ID"   ← change this
  slotDate: "2026-04-01"
```

---

## Step 4 — Run a Single Test

```bash
# From the server/ directory:
npx artillery run performance/tests/auth.user.yml
```

Artillery will print a live summary table to the terminal.

---

## Step 5 — Run a Test and Save an HTML Report

```bash
# 1. Run and save raw JSON output
npx artillery run --output performance/reports/auth.user.json performance/tests/auth.user.yml

# 2. Convert JSON to a human-readable HTML report
npx artillery report --output performance/reports/auth.user.html performance/reports/auth.user.json

# Then open the HTML file in your browser to see charts.
```

---

## Step 6 — Run All Tests at Once

```bash
# From the server/ directory:
node performance/run-all.js
```

This runs every `.yml` file in sequence and saves a JSON + HTML report for each  
into `performance/reports/`.

---

## Metrics to Watch

| Metric | What it means |
|---|---|
| `http.request_rate` | Requests per second (throughput) |
| `http.response_time.mean` | Average latency in milliseconds |
| `http.response_time.p95` | 95th-percentile latency — worst 5% of requests |
| `http.response_time.p99` | 99th-percentile latency — worst 1% of requests |
| `http.codes.200` / `201` | Successful responses |
| `http.codes.4xx` / `5xx` | Client / server errors under load |
| `vusers.failed` | Virtual users that hit an unhandled error |

**General guidelines for a web API:**
- Mean latency < 200 ms ✔
- p95 latency < 500 ms ✔
- p99 latency < 1000 ms ✔
- Error rate < 1 % ✔

---

## Adding a New Endpoint Test

1. Open the relevant `.yml` file (or create a new one for a new route group).
2. Add a new entry under `scenarios:` with a descriptive `name:`.
3. Set a `weight:` proportional to how frequently that endpoint is called.
4. Add the HTTP verb block (`get:`, `post:`, `put:`, `delete:`) with the `url:` and any `json:` body.
5. Add an `expect: - statusCode: 200` assertion so failures are flagged automatically.

**Minimal example — adding a new GET endpoint:**
```yaml
  - name: "Get prescription by ID"
    weight: 2
    flow:
      - get:
          url: "/api/prescriptions/{{ prescriptionId }}"
          expect:
            - statusCode: 200
```

---

## Advanced Artillery Features

These are optional features for more complex load scenarios:

### Multi-phase load profiles
Simulate real traffic patterns: gradual morning ramp-up, midday peak, quiet evenings.
```yaml
phases:
  - name: "Morning ramp"
    duration: 60
    arrivalRate: 5
    rampTo: 30
  - name: "Midday peak"
    duration: 120
    arrivalRate: 30
  - name: "Evening wind-down"
    duration: 60
    arrivalRate: 30
    rampTo: 5
```

### CSV data files for realistic payloads
Feed real user emails/IDs from a CSV instead of hardcoding them:
```yaml
config:
  payload:
    path: "test-users.csv"   # columns: email,password
    fields:
      - email
      - password
```

### Capture and chain requests (session simulation)
Capture a login token and reuse it across multiple requests in the same scenario:
```yaml
flow:
  - post:
      url: "/api/auth/login"
      json: { email: "{{ email }}", password: "{{ password }}" }
      capture:
        - json: "$.token"
          as: "tok"
  - get:
      url: "/api/auth/me"
      headers:
        Authorization: "Bearer {{ tok }}"
```

### Think time (realistic pacing)
Simulate a user pausing between page loads:
```yaml
flow:
  - get:
      url: "/api/doctors"
  - think: 2    # pause 2 seconds — mimics a user reading the page
  - get:
      url: "/api/appointments/user/{{ userId }}"
```

### Environment-specific targets
Run against staging without editing files:
```bash
ARTILLERY_TARGET=https://staging.healthcenter.com npx artillery run tests/doctors.yml
```
Then in your YAML:
```yaml
config:
  target: "{{ $processEnvironment.ARTILLERY_TARGET }}"
```
