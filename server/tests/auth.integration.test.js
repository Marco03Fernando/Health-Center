/**
 * Integration tests — User Auth endpoints (/api/auth)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { connect, disconnect, clearCollections } = require('./helpers/db');
const createTestApp = require('./helpers/testApp');
const User = require('../src/models/doctorChanneling/user.model');

const app = createTestApp();

// Ensure JWT secret is set for generateToken used by controllers
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

// Increase default timeout for potentially slow integration flows
jest.setTimeout(30000);

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
}, 90000);

afterEach(async () => {
  await clearCollections();
});

describe('POST /api/auth/register', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ fullName: 'A' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('creates a patient and returns 201 with token', async () => {
    const payload = {
      fullName: 'Test Patient',
      phone: '0771234567',
      email: 'patient@example.com',
      password: 'secret123',
    };

    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', payload.email);
  });

  it('returns 400 for duplicate registration', async () => {
    const payload = {
      fullName: 'Dup',
      phone: '0770000000',
      email: 'dup@example.com',
      password: 'secret',
    };

    await User.create(payload);

    const res = await request(app).post('/api/auth/register').send(payload);
    expect([400, 500]).toContain(res.status);
    expect(res.body).toHaveProperty('message');
  });
});

describe('POST /api/auth/login and protected routes', () => {
  it('requires email and password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'noone@example.com', password: 'x' });
    expect(res.status).toBe(401);
  });

  it('login sets session and allows access to protected endpoints', async () => {
    const userPayload = {
      fullName: 'Sess User',
      phone: '0771112222',
      email: 'sess@example.com',
      password: 'mypassword',
    };

    await User.create(userPayload);

    const agent = request.agent(app);

    const loginRes = await agent.post('/api/auth/login').send({ email: userPayload.email, password: userPayload.password });
    expect(loginRes.status).toBe(200);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body).toHaveProperty('user');
    expect(meRes.body.user.email).toBe(userPayload.email);

    // Update profile
    const updateRes = await agent.patch('/api/auth/me').send({ fullName: 'Updated', phone: '0770001111', email: 'updated@example.com' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.user.email).toBe('updated@example.com');

    // Change password with wrong current password
    const badChange = await agent.patch('/api/auth/change-password').send({ currentPassword: 'wrong', newPassword: 'newpass' });
    expect(badChange.status).toBe(400);

    // Change password with correct current password
    const goodChange = await agent.patch('/api/auth/change-password').send({ currentPassword: userPayload.password, newPassword: 'newpass123' });
    expect(goodChange.status).toBe(200);

    // Logout and ensure protected route fails
    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);

    const afterLogout = await agent.get('/api/auth/me');
    expect(afterLogout.status).toBe(401);
  });
});
