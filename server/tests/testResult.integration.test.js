/**
 * Integration tests — Test Results (/api/test-results)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { connect, disconnect, clearCollections } = require('./helpers/db');
const createTestApp = require('./helpers/testApp');
const DiagnosticTest = require('../src/models/DiagnosticTest');
const Booking = require('../src/models/Appoinment');
const TestResult = require('../src/models/TestManagement/TestResult');

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

describe('POST /api/test-results', () => {
  it('creates a test result and returns 201 (no external notifications)', async () => {
    const testType = await DiagnosticTest.create({ testCode: 'TR-1', name: 'TR Name' });

    const booking = await Booking.create({
      user: new mongoose.Types.ObjectId(),
      slot: new mongoose.Types.ObjectId(),
      diagnosticTest: testType._id,
      healthCenter: new mongoose.Types.ObjectId(),
    });

    const payload = {
      appointmentId: booking._id,
      testTypeId: testType._id,
      results: [{ name: 'Parameter1', value: 5, unit: 'mg/dL' }],
    };

    const res = await request(app).post('/api/test-results').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
  });

  it('returns 400 when results array missing', async () => {
    const res = await request(app).post('/api/test-results').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/test-results and helpers', () => {
  it('GET all returns created result', async () => {
    const testType = await DiagnosticTest.create({ testCode: 'TR-2', name: 'TR2' });
    const booking = await Booking.create({ user: new mongoose.Types.ObjectId(), slot: new mongoose.Types.ObjectId(), diagnosticTest: testType._id, healthCenter: new mongoose.Types.ObjectId() });

    const created = await TestResult.create({ appointmentId: booking._id, testTypeId: testType._id, results: [{ name: 'P', value: 1, unit: 'u' }] });

    const res = await request(app).get('/api/test-results');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.find((r) => r._id === created._id.toString())).toBeTruthy();
  });

  it('GET /:id returns 404 for non-existent id', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/test-results/${id}`);
    expect(res.status).toBe(404);
  });

  it('PDF generation returns application/pdf when result exists', async () => {
    const testType = await DiagnosticTest.create({ testCode: 'TR-3', name: 'TR3' });
    const booking = await Booking.create({ user: new mongoose.Types.ObjectId(), slot: new mongoose.Types.ObjectId(), diagnosticTest: testType._id, healthCenter: new mongoose.Types.ObjectId() });
    const created = await TestResult.create({ appointmentId: booking._id, testTypeId: testType._id, results: [{ name: 'P', value: 1, unit: 'u' }] });

    const res = await request(app).get(`/api/test-results/${created._id.toString()}/pdf`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
  });

  it('resend WhatsApp/email returns 400 when contact missing', async () => {
    const testType = await DiagnosticTest.create({ testCode: 'TR-4', name: 'TR4' });
    const booking = await Booking.create({ user: new mongoose.Types.ObjectId(), slot: new mongoose.Types.ObjectId(), diagnosticTest: testType._id, healthCenter: new mongoose.Types.ObjectId() });
    const created = await TestResult.create({ appointmentId: booking._id, testTypeId: testType._id, results: [{ name: 'P', value: 1, unit: 'u' }] });

    const wa = await request(app).post(`/api/test-results/${created._id.toString()}/send-whatsapp`);
    expect([400, 500]).toContain(wa.status);

    const em = await request(app).post(`/api/test-results/${created._id.toString()}/send-email`);
    expect([400, 500]).toContain(em.status);
  });
});
