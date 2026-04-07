const request = require('supertest');
const express = require('express');

const router = require('./appointmentRoutes');

describe('appointment routes', () => {
  const app = express();
  app.use(express.json());
  app.use(router); // routes have /api prefix

  it('POST /api/bookappointment without required fields returns 400', async () => {
    const res = await request(app).post('/api/bookappointment').send({});
    expect(res.status).toBe(400);
    expect(res.body).toBeDefined();
  });
});
