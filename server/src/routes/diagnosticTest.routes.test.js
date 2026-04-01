const request = require('supertest');
const express = require('express');

// Mock the model used by controller
jest.mock('../controllers/appoinment/diagnosticTest.controller', () => {
  const original = jest.requireActual('../controllers/appoinment/diagnosticTest.controller');
  return {
    ...original,
    getAllTests: (req, res) => res.json({ success: true, count: 1, data: [{ _id: '1' }] }),
    getTestById: (req, res) => res.json({ success: true, data: { _id: req.params.id } }),
    createTest: (req, res) => res.status(201).json({ success: true, data: req.body }),
  };
});

const router = require('./diagnosticTest.routes');

describe('diagnosticTest routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/diagnostic-tests', router);

  it('GET /api/diagnostic-tests responds with list', async () => {
    const res = await request(app).get('/api/diagnostic-tests');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
  });

  it('POST /api/diagnostic-tests responds 201 when creating', async () => {
    const payload = { name: 'X', instructions: 'p' };
    const res = await request(app).post('/api/diagnostic-tests').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
