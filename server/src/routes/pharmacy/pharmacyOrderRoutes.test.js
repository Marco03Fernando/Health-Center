const request = require('supertest');
const express = require('express');

// Mock auth middlewares to bypass protection in route tests
jest.mock('../../../src/middlewares/auth.middleware', () => ({ protect: (req, res, next) => next() }));
jest.mock('../../../src/middlewares/role.middleware', () => ({ allowRoles: () => (req, res, next) => next() }));

const router = require('./pharmacyOrderRoutes');

describe('pharmacy order routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/pharmacy-orders', router);

  it('GET /api/pharmacy-orders/test returns ok', async () => {
    const res = await request(app).get('/api/pharmacy-orders/test');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('POST /api/pharmacy-orders without required fields returns 400', async () => {
    const res = await request(app).post('/api/pharmacy-orders').send({});
    expect(res.status).toBe(400);
    expect(res.body).toBeDefined();
  });
});
