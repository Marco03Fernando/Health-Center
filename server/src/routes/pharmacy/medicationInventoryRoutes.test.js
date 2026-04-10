const request = require('supertest');
const express = require('express');

// Mock auth middlewares to bypass protection in route tests
jest.mock('../../../src/middlewares/auth.middleware', () => ({ protect: (req, res, next) => next() }));
jest.mock('../../../src/middlewares/role.middleware', () => ({ allowRoles: () => (req, res, next) => next() }));

// Mock model for list endpoint
jest.mock('../../models/pharmacy/medicationInventory');
const MedicationInventory = require('../../models/pharmacy/medicationInventory');

const router = require('./medicationInventoryRoutes');

describe('medication inventory routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/medication-inventory', router);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /api/medication-inventory/test returns ok', async () => {
    const res = await request(app).get('/api/medication-inventory/test');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/medication-inventory returns list', async () => {
    const items = [{ _id: 'm1' }];
    MedicationInventory.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(items) });
    const res = await request(app).get('/api/medication-inventory');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});
