/**
 * Integration tests — Doctor Channeling (centers, doctors, slots, appointments)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { connect, disconnect, clearCollections } = require('./helpers/db');
const createTestApp = require('./helpers/testApp');

const Center = require('../src/models/doctorChanneling/center.model');
const User = require('../src/models/doctorChanneling/user.model');
const Doctor = require('../src/models/doctorChanneling/doctor.model');
const Slot = require('../src/models/doctorChanneling/slot.model');
const Appointment = require('../src/models/doctorChanneling/appointment.model');

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

describe('Centers and Doctors public endpoints', () => {
  it('GET /api/centers returns empty then returns created center', async () => {
    let res = await request(app).get('/api/centers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);

    const center = await Center.create({ name: 'Test Center', address: 'Addr', district: 'D1', phone: '077' });

    res = await request(app).get('/api/centers');
    expect(res.status).toBe(200);
    expect(res.body.data.find((c) => c._id === center._id.toString())).toBeTruthy();
  });

  it('GET /api/doctors lists created doctors and supports center filter', async () => {
    const center1 = await Center.create({ name: 'C1' });
    const center2 = await Center.create({ name: 'C2' });

    // create users and doctors
    const userA = await User.create({ fullName: 'Dr A', phone: '077', email: 'a@example.com', password: 'secret', role: 'doctor' });
    const docA = await Doctor.create({ userId: userA._id, name: 'Doc A', specialization: 'Gen', clinic: 'Clinic', fee: 500, phone: '077', centerId: center1._id });

    const userB = await User.create({ fullName: 'Dr B', phone: '077', email: 'b@example.com', password: 'secret', role: 'doctor' });
    const docB = await Doctor.create({ userId: userB._id, name: 'Doc B', specialization: 'Ent', clinic: 'Clinic', fee: 400, phone: '077', centerId: center2._id });

    const resAll = await request(app).get('/api/doctors');
    expect(resAll.status).toBe(200);
    expect(Array.isArray(resAll.body.items || resAll.body)).toBe(true);

    const resCenter = await request(app).get(`/api/doctors?centerId=${center1._id.toString()}`);
    expect(resCenter.status).toBe(200);
    const items = resCenter.body.items || resCenter.body;
    expect(items.find((d) => d._id === docA._id.toString())).toBeTruthy();
    expect(items.find((d) => d._id === docB._id.toString())).toBeFalsy();
  });
});

describe('Slots and Appointments', () => {
  it('GET /api/slots returns slots for doctor/date and POST /api/appointments creates appointment when authenticated', async () => {
    // create center, doctor and a patient via auth flow
    const center = await Center.create({ name: 'Slot Center' });

    // create doctor user and doctor
    const doctorUser = await User.create({ fullName: 'Doctor User', phone: '077', email: 'docslot@example.com', password: 'secret', role: 'doctor' });
    const doctor = await Doctor.create({ userId: doctorUser._id, name: 'Doctor Slot', specialization: 'Gen', clinic: 'C', fee: 300, phone: '077', centerId: center._id });

    // create a patient by registering through the auth API to get a session
    const agent = request.agent(app);
    const patientPayload = { fullName: 'Pat One', phone: '0779999999', email: 'pat1@example.com', password: 'password' };
    const regRes = await agent.post('/api/auth/register').send(patientPayload);
    expect(regRes.status).toBe(201);
    // login to establish session (register doesn't create session)
    const loginRes = await agent.post('/api/auth/login').send({ email: patientPayload.email, password: patientPayload.password });
    expect(loginRes.status).toBe(200);

    // create a future date slot
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const dateStr = date.toISOString().slice(0, 10);

    const slot = await Slot.create({ centerId: center._id, doctorId: doctor._id, date: dateStr, startTime: '09:00', endTime: '09:30' });

    // query slots
    const slotsRes = await request(app).get(`/api/slots?doctorId=${doctor._id.toString()}&date=${dateStr}`);
    expect(slotsRes.status).toBe(200);
    expect(slotsRes.body.success).toBe(true);
    expect(slotsRes.body.data.find((s) => s._id === slot._id.toString())).toBeTruthy();

    // create appointment using authenticated agent (use token from login)
    const token = loginRes.body.token;
    expect(token).toBeDefined();
    const apptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ centerId: center._id, doctorId: doctor._id, slotId: slot._id });
    expect(apptRes.status).toBe(201);
    expect(apptRes.body.success).toBe(true);
    expect(apptRes.body.data).toHaveProperty('_id');

    // verify slot is now booked in DB
    const reloaded = await Slot.findById(slot._id);
    expect(reloaded.isBooked).toBe(true);
  });
});
