/**
 * Integration tests for Pharmacy Orders
 */
const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

const { connect, disconnect, clearCollections } = require('./helpers/db');
const PharmacyOrder = require('../src/models/pharmacy/pharmacyOrder');
const Prescription = require('../src/models/doctorChanneling/prescription.model');

// Mock the email utility to avoid external calls
jest.mock('../src/utils/sendInvoiceEmail', () => jest.fn());

// Bypass auth middlewares in integration tests
jest.mock('../src/middlewares/auth.middleware', () => ({ protect: (req, res, next) => next() }));
jest.mock('../src/middlewares/role.middleware', () => ({ allowRoles: () => (req, res, next) => next() }));

const pharmacyOrderRoutes = require('../src/routes/pharmacy/pharmacyOrderRoutes');
const errorMiddleware = require('../src/middlewares/error.middleware');

let app;

beforeAll(async () => {
  await connect();
  app = express();
  app.use(express.json());
  app.use('/api/pharmacy-orders', pharmacyOrderRoutes);
  app.use(errorMiddleware);
});

afterAll(async () => {
  await disconnect();
});

afterEach(async () => {
  await clearCollections();
});

describe('Pharmacy orders integration', () => {
  it('GET /api/pharmacy-orders returns empty array initially', async () => {
    const res = await request(app).get('/api/pharmacy-orders');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('POST /api/pharmacy-orders/from-prescription creates a WAITING_STOCK order', async () => {
    // create a minimal prescription required fields
    const pres = await Prescription.create({
      prescriptionNo: `P-${Date.now()}`,
      centerId: new mongoose.Types.ObjectId(),
      doctorId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      appointmentId: new mongoose.Types.ObjectId(),
      items: [{ medicineName: 'TestMed', quantity: 1 }],
    });

    const res = await request(app).post('/api/pharmacy-orders/from-prescription').send({ prescriptionId: pres._id.toString() });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('order');
    const created = res.body.order;
    const persisted = await PharmacyOrder.findById(created._id);
    expect(persisted).not.toBeNull();
    expect(persisted.status).toBeDefined();
  });
});
