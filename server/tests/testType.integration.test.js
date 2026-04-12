/**
 * Integration tests — Test Types (/api/test-types)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { connect, disconnect, clearCollections } = require('./helpers/db');
const createTestApp = require('./helpers/testApp');
const DiagnosticTest = require('../src/models/DiagnosticTest');

const app = createTestApp();

jest.setTimeout(30000);
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
}, 90000);

afterEach(async () => {
  await clearCollections();
});

describe('POST /api/test-types', () => {
  it('returns 400 when required fields missing', async () => {
    const res = await request(app).post('/api/test-types').send({ name: 'X' });
    expect(res.status).toBe(400);
  });

  it('creates a test type and returns 201', async () => {
    const payload = {
      testCode: 'TT-001',
      name: 'Full Blood Count',
      description: 'FBC description',
      price: 500,
    };

    const res = await request(app).post('/api/test-types').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe(payload.name);
  });

  it('returns 400 on duplicate testCode', async () => {
    const payload = { testCode: 'DUP', name: 'Dup Test' };
    await DiagnosticTest.create(payload);

    const res = await request(app).post('/api/test-types').send(payload);
    expect([400, 500]).toContain(res.status);
  });
});

describe('GET /api/test-types', () => {
  it('returns empty array when none exist', async () => {
    const res = await request(app).get('/api/test-types');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('returns created test types', async () => {
    await DiagnosticTest.create({ testCode: 'A', name: 'A' });
    await DiagnosticTest.create({ testCode: 'B', name: 'B' });

    const res = await request(app).get('/api/test-types');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

describe('GET/PUT/DELETE /api/test-types/:id', () => {
  it('returns 404 for non-existent id', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/test-types/${id}`);
    expect(res.status).toBe(404);
  });

  it('supports update and delete lifecycle', async () => {
    const created = await DiagnosticTest.create({ testCode: 'LIFE', name: 'Lifecycle' });

    const getRes = await request(app).get(`/api/test-types/${created._id.toString()}`);
    expect(getRes.status).toBe(200);

    const up = await request(app).put(`/api/test-types/${created._id.toString()}`).send({ name: 'Updated' });
    expect(up.status).toBe(200);
    expect(up.body.name).toBe('Updated');

    const del = await request(app).delete(`/api/test-types/${created._id.toString()}`);
    expect(del.status).toBe(200);

    const after = await request(app).get(`/api/test-types/${created._id.toString()}`);
    expect(after.status).toBe(404);
  });
});
