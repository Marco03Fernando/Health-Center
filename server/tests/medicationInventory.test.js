/**
 * Integration tests for Medication Inventory
 */
const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

const { connect, disconnect, clearCollections } = require('./helpers/db');
const MedicationInventory = require('../src/models/pharmacy/medicationInventory');

// Bypass auth middlewares in integration tests
jest.mock('../src/middlewares/auth.middleware', () => ({ protect: (req, res, next) => next() }));
jest.mock('../src/middlewares/role.middleware', () => ({ allowRoles: () => (req, res, next) => next() }));

const medicationInventoryRoutes = require('../src/routes/pharmacy/medicationInventoryRoutes');
const errorMiddleware = require('../src/middlewares/error.middleware');

let app;

beforeAll(async () => {
  await connect();
  app = express();
  app.use(express.json());

  // attach a fake user to requests so batch addedBy fields are populated
  app.use((req, res, next) => {
    req.user = { _id: new mongoose.Types.ObjectId(), fullName: 'Tester', email: 't@test' };
    next();
  });

  app.use('/api/medication-inventory', medicationInventoryRoutes);
  app.use(errorMiddleware);
});

afterAll(async () => {
  await disconnect();
});

afterEach(async () => {
  await clearCollections();
});

describe('Medication inventory integration', () => {
  it('POST /api/medication-inventory creates medication and GET returns it', async () => {
    const createBody = { name: 'Paracetamol', strength: '500mg', form: 'tablet' };
    const postRes = await request(app).post('/api/medication-inventory').send(createBody);
    expect(postRes.status).toBe(201);
    expect(postRes.body).toHaveProperty('_id');

    const getRes = await request(app).get('/api/medication-inventory');
    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body)).toBe(true);
    expect(getRes.body.find((m) => m.name === 'Paracetamol')).toBeDefined();
  });

  it('POST /api/medication-inventory/:id/batches adds a batch', async () => {
    const med = await MedicationInventory.create({ name: 'Ibuprofen', strength: '200mg', form: 'tablet' });

    const batch = { batchNo: 'B-1', expiryDate: '2030-01-01', quantity: 10, unitPrice: 5 };
    const res = await request(app).post(`/api/medication-inventory/${med._id.toString()}/batches`).send(batch);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('batches');
    expect(res.body.batches.find((b) => b.batchNo === 'B-1')).toBeDefined();
  });
});
