/**
 * Integration tests — Diagnostic Test APIs
 *
 * All routes are mounted at /api/lab/diagnostic-tests (see server.js):
 *
 *   GET    /api/lab/diagnostic-tests             — getAllTests
 *   GET    /api/lab/diagnostic-tests/:id         — getTestById
 *   POST   /api/lab/diagnostic-tests             — createTest
 *   PUT    /api/lab/diagnostic-tests/:id         — updateTest
 *   DELETE /api/lab/diagnostic-tests/:id         — deleteTest (soft-delete)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { connect, disconnect, clearCollections } = require('./helpers/db');
const createTestApp = require('./helpers/testApp');
const DiagnosticTest = require('../src/models/DiagnosticTest');

const app = createTestApp();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let _counter = 0;

/** Creates a DiagnosticTest document directly in the DB (bypasses REST API). */
async function seedTest(overrides = {}) {
  _counter += 1;
  return DiagnosticTest.create({
    name: `Test-${_counter}-${Date.now()}`,
    description: 'A sample test',
    category: 'Blood',
    price: 750,
    sampleTypes: 'Venous blood',
    instructions: 'Fast for 8 hours before the test.',
    parameters: [],
    isActive: true,
    ...overrides,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite setup
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
}, 90000);

afterEach(async () => {
  await clearCollections();
});

// =============================================================================
// GET /api/lab/diagnostic-tests — getAllTests
// =============================================================================
describe('GET /api/lab/diagnostic-tests', () => {
  it('returns 200 with an empty array when no tests exist', async () => {
    const res = await request(app).get('/api/lab/diagnostic-tests');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns 200 with only active tests', async () => {
    await seedTest({ isActive: true });
    await seedTest({ isActive: false }); // should be excluded

    const res = await request(app).get('/api/lab/diagnostic-tests');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1); // only the active one
    expect(res.body.data[0].isActive).toBe(true);
  });

  it('returns 200 with multiple active tests sorted by name', async () => {
    await seedTest({ name: 'Zebra Test' });
    await seedTest({ name: 'Alpha Test' });
    await seedTest({ name: 'Mango Test' });

    const res = await request(app).get('/api/lab/diagnostic-tests');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    expect(res.body.data[0].name).toBe('Alpha Test');
    expect(res.body.data[2].name).toBe('Zebra Test');
  });

  it('filters tests by centerId query param', async () => {
    const centerId1 = new mongoose.Types.ObjectId();
    const centerId2 = new mongoose.Types.ObjectId();

    await seedTest({ centerId: centerId1 });
    await seedTest({ centerId: centerId2 });

    const res = await request(app)
      .get(`/api/lab/diagnostic-tests?centerId=${centerId1.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].centerId.toString()).toBe(centerId1.toString());
  });

  it('response body contains expected fields', async () => {
    await seedTest({ name: 'CBC Test', category: 'Blood', price: 500 });

    const res = await request(app).get('/api/lab/diagnostic-tests');

    expect(res.status).toBe(200);
    const item = res.body.data[0];
    expect(item).toHaveProperty('_id');
    expect(item).toHaveProperty('name', 'CBC Test');
    expect(item).toHaveProperty('category', 'Blood');
    expect(item).toHaveProperty('price', 500);
    expect(item).toHaveProperty('testCode');
    expect(item).toHaveProperty('isActive', true);
  });
});

// =============================================================================
// GET /api/lab/diagnostic-tests/:id — getTestById
// =============================================================================
describe('GET /api/lab/diagnostic-tests/:id', () => {
  it('returns 200 with the test for a valid id', async () => {
    const test = await seedTest({ name: 'LFT Test' });

    const res = await request(app)
      .get(`/api/lab/diagnostic-tests/${test._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(test._id.toString());
    expect(res.body.data.name).toBe('LFT Test');
  });

  it('also retrieves inactive tests by id (unfiltered route)', async () => {
    const test = await seedTest({ isActive: false });

    const res = await request(app)
      .get(`/api/lab/diagnostic-tests/${test._id.toString()}`);

    // getTestById does NOT filter by isActive — it fetches by raw id
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('returns 404 for a non-existent id', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .get(`/api/lab/diagnostic-tests/${nonExistentId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns 500 for a malformed id (cast error)', async () => {
    // Mongoose throws a CastError for a completely invalid ObjectId
    const res = await request(app)
      .get('/api/lab/diagnostic-tests/not-a-valid-id');

    // Error middleware converts it to 500 (no explicit cast-guard in controller)
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

// =============================================================================
// POST /api/lab/diagnostic-tests — createTest
// =============================================================================
describe('POST /api/lab/diagnostic-tests', () => {
  it('returns 201 and creates a test with a generated testCode', async () => {
    const res = await request(app)
      .post('/api/lab/diagnostic-tests')
      .send({
        name: 'RBC Count',
        description: 'Red blood cell count test',
        category: 'Hematology',
        price: 450,
        sampleTypes: 'Whole blood',
        instructions: 'No fasting required.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('RBC Count');
    // testCode is auto-generated by the model pre-save hook
    expect(res.body.data.testCode).toMatch(/^DT-/);
  });

  it('returns 201 with parameters array when provided', async () => {
    const params = [
      { name: 'Haemoglobin', unit: 'g/dL', normalMinValue: 12, normalMaxValue: 17 },
    ];

    const res = await request(app)
      .post('/api/lab/diagnostic-tests')
      .send({ name: 'HB Test', parameters: params });

    expect(res.status).toBe(201);
    expect(res.body.data.parameters).toHaveLength(1);
    expect(res.body.data.parameters[0].name).toBe('Haemoglobin');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/lab/diagnostic-tests')
      .send({ category: 'Blood', price: 300 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/name is required/i);
  });

  it('returns error on duplicate test name', async () => {
    const testName = `Duplicate-${Date.now()}`;
    await seedTest({ name: testName });

    const res = await request(app)
      .post('/api/lab/diagnostic-tests')
      .send({ name: testName });

    // Mongoose unique constraint violation → controller passes error to next()
    expect([400, 409, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('defaults parameters to an empty array when not provided', async () => {
    const res = await request(app)
      .post('/api/lab/diagnostic-tests')
      .send({ name: 'Urine Routine' });

    expect(res.status).toBe(201);
    expect(res.body.data.parameters).toEqual([]);
  });

  it('defaults isActive to true on create', async () => {
    const res = await request(app)
      .post('/api/lab/diagnostic-tests')
      .send({ name: 'Thyroid Panel' });

    expect(res.status).toBe(201);
    expect(res.body.data.isActive).toBe(true);
  });
});

// =============================================================================
// PUT /api/lab/diagnostic-tests/:id — updateTest
// =============================================================================
describe('PUT /api/lab/diagnostic-tests/:id', () => {
  it('returns 200 and updates the test fields', async () => {
    const test = await seedTest({ name: 'Old Name', price: 200 });

    const res = await request(app)
      .put(`/api/lab/diagnostic-tests/${test._id.toString()}`)
      .send({ price: 350, description: 'Updated description' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.price).toBe(350);
    expect(res.body.data.description).toBe('Updated description');
  });

  it('returns the updated document (new: true)', async () => {
    const test = await seedTest({ name: 'Electrolytes', category: 'Chemistry' });

    const res = await request(app)
      .put(`/api/lab/diagnostic-tests/${test._id.toString()}`)
      .send({ category: 'Biochemistry' });

    expect(res.status).toBe(200);
    expect(res.body.data.category).toBe('Biochemistry');
  });

  it('returns 404 for a non-existent id', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .put(`/api/lab/diagnostic-tests/${nonExistentId}`)
      .send({ price: 500 });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns error for malformed id', async () => {
    const res = await request(app)
      .put('/api/lab/diagnostic-tests/bad-id')
      .send({ price: 100 });

    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when runValidators catches an invalid price (< 0)', async () => {
    const test = await seedTest({ name: `Neg-Price-${Date.now()}` });

    const res = await request(app)
      .put(`/api/lab/diagnostic-tests/${test._id.toString()}`)
      .send({ price: -100 });

    // Schema has min: 0 for price and runValidators: true in the controller
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

// =============================================================================
// DELETE /api/lab/diagnostic-tests/:id — deleteTest (soft delete)
// =============================================================================
describe('DELETE /api/lab/diagnostic-tests/:id', () => {
  it('returns 200 and soft-deletes the test (sets isActive: false)', async () => {
    const test = await seedTest({ name: 'To Be Deleted' });

    const res = await request(app)
      .delete(`/api/lab/diagnostic-tests/${test._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted successfully/i);

    // Verify isActive is false in DB
    const persisted = await DiagnosticTest.findById(test._id);
    expect(persisted).not.toBeNull();       // document still exists
    expect(persisted.isActive).toBe(false); // but is soft-deleted
  });

  it('hidden from GET /api/lab/diagnostic-tests after soft-delete', async () => {
    const test = await seedTest({ name: 'HideMe' });

    await request(app).delete(`/api/lab/diagnostic-tests/${test._id.toString()}`);

    const res = await request(app).get('/api/lab/diagnostic-tests');
    const names = res.body.data.map((d) => d.name);
    expect(names).not.toContain('HideMe');
  });

  it('returns 404 for a non-existent id', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .delete(`/api/lab/diagnostic-tests/${nonExistentId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns error for a malformed id', async () => {
    const res = await request(app)
      .delete('/api/lab/diagnostic-tests/not-an-id');

    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('can soft-delete an already soft-deleted test without error', async () => {
    const test = await seedTest({ isActive: false });

    const res = await request(app)
      .delete(`/api/lab/diagnostic-tests/${test._id.toString()}`);

    // findByIdAndUpdate returns the updated doc — it still exists, so 200
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
