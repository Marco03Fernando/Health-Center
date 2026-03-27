const request = require('supertest');
const express = require('express');

const router = require('./appointmentSlotRoutes');

describe('appointmentSlot routes', () => {
  const app = express();
  app.use(express.json());
  app.use(router); // routes include their own /api prefix

  it('POST /api/generateSlots without body returns 400', async () => {
    const res = await request(app).post('/api/generateSlots').send({});
    expect(res.status).toBe(400);
    expect(res.body).toBeDefined();
  });
});
