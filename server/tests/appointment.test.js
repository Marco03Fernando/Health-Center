/**
 * Integration tests — Appointment Booking & Slot Management APIs
 *
 * Covered routes (all paths match server.js mount points):
 *
 *  Booking
 *   POST   /api/bookappointment
 *   GET    /api/appointment/:bookingId
 *   GET    /api/user-appointments/:userId
 *   PUT    /api/updateappointment/:bookingId
 *   DELETE /api/deleteappointment/:bookingId
 *   GET    /api/getappointments/:centerId
 *   GET    /api/getallappointments
 *
 *  Slots
 *   POST   /api/generateSlots
 *   GET    /api/getSlots
 *   GET    /api/getSlotsByCenter/:centerId
 *   GET    /api/getAvailableAppointmentSlots/:centerId
 *   PUT    /api/updateSlot/:id
 *   DELETE /api/deleteSlot/:id
 *   DELETE /api/deleteExpiredUnbooked
 *   DELETE /api/deleteUpcomingUnbooked
 */

// Mock email service — external dependency; no SMTP server required in tests
jest.mock('../src/utils/emailService', () => ({
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendBookingCancellationEmail: jest.fn().mockResolvedValue(undefined),
  sendBookingCompletedEmail: jest.fn().mockResolvedValue(undefined),
}));

// Replica-set teardown (MongoMemoryReplSet.stop) can be slow
jest.setTimeout(30000);

const request = require('supertest');
const mongoose = require('mongoose');
const { connect, disconnect, clearCollections } = require('./helpers/db');
const createTestApp = require('./helpers/testApp');

// Models — used to seed the in-memory DB directly
const HealthCenter = require('../src/models/HealthCenter');
const AppointmentSlot = require('../src/models/AppoinmentSlot');
const Booking = require('../src/models/Appoinment');
const User = require('../src/models/User');
const DiagnosticTest = require('../src/models/DiagnosticTest');

const app = createTestApp();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a UTC-midnight Date N days from today. */
function futureDateUTC(daysFromNow = 7) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Returns a YYYY-MM-DD string N days from today. */
function futureDateString(daysFromNow = 7) {
  const d = futureDateUTC(daysFromNow);
  return d.toISOString().split('T')[0];
}

// Seed helpers ----------------------------------------------------------------

async function seedCenter(overrides = {}) {
  return HealthCenter.create({
    name: 'Test Health Center',
    address: '1 Main St',
    district: 'Colombo',
    openingTime: '08:00',
    closingTime: '17:00',
    ...overrides,
  });
}

async function seedUser(overrides = {}) {
  return User.create({
    fullName: 'Test User',
    phone: '0711234567',
    email: `test${Date.now()}@example.com`,
    role: 'PATIENT',
    ...overrides,
  });
}

async function seedDiagnosticTest(overrides = {}) {
  return DiagnosticTest.create({
    name: `Test ${Date.now()}`,
    category: 'Blood',
    price: 500,
    ...overrides,
  });
}

async function seedAvailableSlot(centerId, overrides = {}) {
  return AppointmentSlot.create({
    center: centerId,
    slotDate: futureDateUTC(7),
    startTime: '10:00',
    endTime: '10:30',
    status: 'AVAILABLE',
    ...overrides,
  });
}

async function seedBooking(userId, slotId, centerId, diagnosticTestId, overrides = {}) {
  return Booking.create({
    user: userId,
    slot: slotId,
    diagnosticTest: diagnosticTestId,
    healthCenter: centerId,
    appointmentDate: futureDateUTC(7),
    appointmentStatus: 'CONFIRMED',
    ...overrides,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite setup
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
}, 90000);

afterEach(async () => {
  await clearCollections();
});

// =============================================================================
// POST /api/bookappointment — bookAppointment
// =============================================================================
describe('POST /api/bookappointment', () => {
  it('returns 201 and creates a booking for a valid AVAILABLE slot', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const diagTest = await seedDiagnosticTest();
    const slot = await seedAvailableSlot(center._id);

    const res = await request(app)
      .post('/api/bookappointment')
      .send({ slotId: slot._id.toString(), userId: user._id.toString(), diagnosticTestId: diagTest._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Booking confirmed');
    expect(res.body.booking).toMatchObject({ appointmentStatus: 'CONFIRMED' });

    // Slot should be marked BOOKED in DB
    const updatedSlot = await AppointmentSlot.findById(slot._id);
    expect(updatedSlot.status).toBe('BOOKED');
  });

  it('returns 400 when slotId is missing', async () => {
    const res = await request(app)
      .post('/api/bookappointment')
      .send({ userId: new mongoose.Types.ObjectId().toString() });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'slotId and userId are required');
  });

  it('returns 400 when userId is missing', async () => {
    const res = await request(app)
      .post('/api/bookappointment')
      .send({ slotId: new mongoose.Types.ObjectId().toString() });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'slotId and userId are required');
  });

  it('returns 404 when the slot does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/api/bookappointment')
      .send({ slotId: nonExistentId, userId });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Appointment slot not found');
  });

  it('returns 400 when slot status is not AVAILABLE', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const slot = await seedAvailableSlot(center._id, { status: 'BOOKED' });

    const res = await request(app)
      .post('/api/bookappointment')
      .send({ slotId: slot._id.toString(), userId: user._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Slot is not available');
  });

  it('returns 400 when booking cutoff time has passed (slot starts within 15 min)', async () => {
    const center = await seedCenter();
    const user = await seedUser();

    // Create a slot whose start date-time is 5 minutes from now (past the 15-min cutoff)
    const near = new Date();
    near.setUTCHours(0, 0, 0, 0); // today UTC midnight as slotDate
    const nowMins = new Date();
    const hh = String(nowMins.getHours()).padStart(2, '0');
    const mm = String(nowMins.getMinutes()).padStart(2, '0');

    const slot = await AppointmentSlot.create({
      center: center._id,
      slotDate: near,         // today
      startTime: `${hh}:${mm}`, // starts right now → cutoff already passed
      endTime: `${String(nowMins.getHours()).padStart(2, '0')}:${String(nowMins.getMinutes() + 30 > 59 ? nowMins.getMinutes() : nowMins.getMinutes() + 30).padStart(2, '0')}`,
      status: 'AVAILABLE',
    });

    const res = await request(app)
      .post('/api/bookappointment')
      .send({ slotId: slot._id.toString(), userId: user._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Booking for this slot has closed/);
  });
});

// =============================================================================
// GET /api/appointment/:bookingId — getAppointmentById
// =============================================================================
describe('GET /api/appointment/:bookingId', () => {
  it('returns 200 with booking data for valid bookingId', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const diagTest = await seedDiagnosticTest();
    const slot = await seedAvailableSlot(center._id, { status: 'BOOKED' });
    const booking = await seedBooking(user._id, slot._id, center._id, diagTest._id);

    const res = await request(app).get(`/api/appointment/${booking._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(booking._id.toString());
  });

  it('returns 404 for a non-existent bookingId', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/appointment/${nonExistentId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns 400 for malformed bookingId', async () => {
    const res = await request(app).get('/api/appointment/not-an-id');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });
});

// =============================================================================
// GET /api/user-appointments/:userId — getUserAppointments
// =============================================================================
describe('GET /api/user-appointments/:userId', () => {
  it('returns 200 with an array of bookings for an existing user', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const diagTest = await seedDiagnosticTest();
    const slot = await seedAvailableSlot(center._id, { status: 'BOOKED' });
    await seedBooking(user._id, slot._id, center._id, diagTest._id);

    const res = await request(app).get(`/api/user-appointments/${user._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns 200 with empty array when user has no bookings', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/user-appointments/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it('returns 400 for an invalid userId format', async () => {
    const res = await request(app).get('/api/user-appointments/bad-id');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it('returns 400 for invalid status query param', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/user-appointments/${userId}?status=UNKNOWN`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid status/i);
  });

  it('filters bookings by status query param', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const diagTest = await seedDiagnosticTest();
    const slot1 = await seedAvailableSlot(center._id, { status: 'BOOKED', startTime: '09:00', endTime: '09:30' });
    const slot2 = await seedAvailableSlot(center._id, { status: 'BOOKED', startTime: '10:00', endTime: '10:30' });

    await seedBooking(user._id, slot1._id, center._id, diagTest._id, { appointmentStatus: 'CONFIRMED' });
    await seedBooking(user._id, slot2._id, center._id, diagTest._id, { appointmentStatus: 'CANCELLED' });

    const res = await request(app)
      .get(`/api/user-appointments/${user._id.toString()}?status=CONFIRMED`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].appointmentStatus).toBe('CONFIRMED');
  });
});

// =============================================================================
// PUT /api/updateappointment/:bookingId — updateAppointment
// =============================================================================
describe('PUT /api/updateappointment/:bookingId', () => {
  it('returns 200 and updates appointment status', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const diagTest = await seedDiagnosticTest();
    const slot = await seedAvailableSlot(center._id, { status: 'BOOKED' });
    const booking = await seedBooking(user._id, slot._id, center._id, diagTest._id);

    const res = await request(app)
      .put(`/api/updateappointment/${booking._id.toString()}`)
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appointmentStatus).toBe('COMPLETED');
  });

  it('cancels booking and makes the slot AVAILABLE again', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const diagTest = await seedDiagnosticTest();
    const slot = await seedAvailableSlot(center._id, { status: 'BOOKED' });
    const booking = await seedBooking(user._id, slot._id, center._id, diagTest._id);

    const res = await request(app)
      .put(`/api/updateappointment/${booking._id.toString()}`)
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(200);
    expect(res.body.data.appointmentStatus).toBe('CANCELLED');

    const updatedSlot = await AppointmentSlot.findById(slot._id);
    expect(updatedSlot.status).toBe('AVAILABLE');
  });

  it('returns 404 for a non-existent booking', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/updateappointment/${nonExistentId}`)
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Booking not found');
  });

  it('updates the diagnosticTest reference on booking', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const diagTest1 = await seedDiagnosticTest({ name: `DT-Old-${Date.now()}` });
    const diagTest2 = await seedDiagnosticTest({ name: `DT-New-${Date.now()}` });
    const slot = await seedAvailableSlot(center._id, { status: 'BOOKED' });
    const booking = await seedBooking(user._id, slot._id, center._id, diagTest1._id);

    const res = await request(app)
      .put(`/api/updateappointment/${booking._id.toString()}`)
      .send({ diagnosticTestId: diagTest2._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.diagnosticTest.toString()).toBe(diagTest2._id.toString());
  });
});

// =============================================================================
// DELETE /api/deleteappointment/:bookingId — deleteAppointment
// =============================================================================
describe('DELETE /api/deleteappointment/:bookingId', () => {
  it('returns 200 and removes the booking, freeing the slot', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const diagTest = await seedDiagnosticTest();
    const slot = await seedAvailableSlot(center._id, { status: 'BOOKED' });
    const booking = await seedBooking(user._id, slot._id, center._id, diagTest._id);

    const res = await request(app)
      .delete(`/api/deleteappointment/${booking._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);

    // Booking should no longer exist in DB
    const deletedBooking = await Booking.findById(booking._id);
    expect(deletedBooking).toBeNull();

    // Slot should be freed
    const freedSlot = await AppointmentSlot.findById(slot._id);
    expect(freedSlot.status).toBe('AVAILABLE');
  });

  it('returns 404 for a non-existent booking', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/deleteappointment/${nonExistentId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});

// =============================================================================
// GET /api/getappointments/:centerId — getCenterAppointments
// =============================================================================
describe('GET /api/getappointments/:centerId', () => {
  it('returns 200 with all appointments for a center', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const diagTest = await seedDiagnosticTest();
    const slot = await seedAvailableSlot(center._id, { status: 'BOOKED' });
    await seedBooking(user._id, slot._id, center._id, diagTest._id);

    const res = await request(app).get(`/api/getappointments/${center._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    // getCenterAppointments does not populate healthCenter; it returns the raw ObjectId
    expect(res.body.data[0].healthCenter.toString()).toBe(center._id.toString());
  });

  it('returns 200 with empty array for center with no appointments', async () => {
    const centerId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/getappointments/${centerId}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it('filters by status query param', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const diagTest = await seedDiagnosticTest();
    const slot1 = await seedAvailableSlot(center._id, { status: 'BOOKED', startTime: '09:00', endTime: '09:30' });
    const slot2 = await seedAvailableSlot(center._id, { status: 'BOOKED', startTime: '10:00', endTime: '10:30' });
    await seedBooking(user._id, slot1._id, center._id, diagTest._id, { appointmentStatus: 'CONFIRMED' });
    await seedBooking(user._id, slot2._id, center._id, diagTest._id, { appointmentStatus: 'CANCELLED' });

    const res = await request(app)
      .get(`/api/getappointments/${center._id.toString()}?status=CANCELLED`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].appointmentStatus).toBe('CANCELLED');
  });
});

// =============================================================================
// GET /api/getallappointments — getAllAppointmentsAdmin
// =============================================================================
describe('GET /api/getallappointments', () => {
  it('returns 200 with all appointments across all centers', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const diagTest = await seedDiagnosticTest();
    const slot = await seedAvailableSlot(center._id, { status: 'BOOKED' });
    await seedBooking(user._id, slot._id, center._id, diagTest._id);

    const res = await request(app).get('/api/getallappointments');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  it('returns 200 with empty list when no appointments exist', async () => {
    const res = await request(app).get('/api/getallappointments');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it('filters by centerId query param', async () => {
    const center1 = await seedCenter({ name: 'Center A' });
    const center2 = await seedCenter({ name: 'Center B' });
    const user = await seedUser();
    const diagTest = await seedDiagnosticTest();
    const slot1 = await seedAvailableSlot(center1._id, { status: 'BOOKED', startTime: '09:00', endTime: '09:30' });
    const slot2 = await seedAvailableSlot(center2._id, { status: 'BOOKED', startTime: '09:00', endTime: '09:30' });
    await seedBooking(user._id, slot1._id, center1._id, diagTest._id);
    await seedBooking(user._id, slot2._id, center2._id, diagTest._id);

    const res = await request(app)
      .get(`/api/getallappointments?centerId=${center1._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].healthCenter._id.toString()).toBe(center1._id.toString());
  });
});

// =============================================================================
// POST /api/generateSlots — generateAppointmentSlots
// =============================================================================
describe('POST /api/generateSlots', () => {
  it('returns 201 and creates slots for a valid health center', async () => {
    const center = await seedCenter({ openingTime: '09:00', closingTime: '12:00' });

    const res = await request(app)
      .post('/api/generateSlots')
      .send({
        healthCenterId: center._id.toString(),
        startDateStr: futureDateString(1),
        numberOfDays: 1,
        slotMinutes: 30,
      });

    expect(res.status).toBe(201);
    expect(res.body.createdCount).toBeGreaterThan(0);
    expect(Array.isArray(res.body.createdSlots)).toBe(true);
  });

  it('returns 400 when healthCenterId is missing', async () => {
    const res = await request(app)
      .post('/api/generateSlots')
      .send({ startDateStr: futureDateString(1), numberOfDays: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when startDate is missing', async () => {
    const center = await seedCenter();
    const res = await request(app)
      .post('/api/generateSlots')
      .send({ healthCenterId: center._id.toString(), numberOfDays: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 for invalid healthCenterId format', async () => {
    const res = await request(app)
      .post('/api/generateSlots')
      .send({ healthCenterId: 'bad-id', startDateStr: futureDateString(1) });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid healthCenterId');
  });

  it('returns 400 when startDate is in the past', async () => {
    const center = await seedCenter();
    const res = await request(app)
      .post('/api/generateSlots')
      .send({
        healthCenterId: center._id.toString(),
        startDateStr: '2020-01-01',
        numberOfDays: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Cannot generate slots for past dates');
  });

  it('returns 404 when health center does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/generateSlots')
      .send({
        healthCenterId: nonExistentId,
        startDateStr: futureDateString(1),
        numberOfDays: 1,
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/HealthCenter not found/i);
  });

  it('skips duplicate slots on re-generation without error', async () => {
    const center = await seedCenter({ openingTime: '09:00', closingTime: '10:00' });
    const payload = {
      healthCenterId: center._id.toString(),
      startDateStr: futureDateString(2),
      numberOfDays: 1,
      slotMinutes: 30,
    };

    // First generation
    await request(app).post('/api/generateSlots').send(payload);
    // Second generation — same date
    const res = await request(app).post('/api/generateSlots').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.skippedCount).toBeGreaterThan(0);
    expect(res.body.createdCount).toBe(0);
  });
});

// =============================================================================
// GET /api/getSlots — getAppointmentSlots
// =============================================================================
describe('GET /api/getSlots', () => {
  it('returns 200 with slots for a valid centerId', async () => {
    const center = await seedCenter();
    await seedAvailableSlot(center._id);

    const res = await request(app)
      .get(`/api/getSlots?center=${center._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
  });

  it('returns 400 when center query param is missing', async () => {
    const res = await request(app).get('/api/getSlots');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/center ID is required/i);
  });

  it('returns 400 for an invalid status filter', async () => {
    const center = await seedCenter();
    const res = await request(app)
      .get(`/api/getSlots?center=${center._id.toString()}&status=INVALID`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid status/i);
  });

  it('filters slots by status', async () => {
    const center = await seedCenter();
    await seedAvailableSlot(center._id, { startTime: '09:00', endTime: '09:30', status: 'AVAILABLE' });
    await seedAvailableSlot(center._id, { startTime: '10:00', endTime: '10:30', status: 'BOOKED' });

    const res = await request(app)
      .get(`/api/getSlots?center=${center._id.toString()}&status=BOOKED`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].status).toBe('BOOKED');
  });
});

// =============================================================================
// GET /api/getSlotsByCenter/:centerId — getAppointmentSlotsByCenterId
// =============================================================================
describe('GET /api/getSlotsByCenter/:centerId', () => {
  it('returns 200 with slots for a valid centerId', async () => {
    const center = await seedCenter();
    await seedAvailableSlot(center._id);

    const res = await request(app)
      .get(`/api/getSlotsByCenter/${center._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
  });

  it('returns 400 for an invalid centerId format', async () => {
    const res = await request(app).get('/api/getSlotsByCenter/invalid-id');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid center id/i);
  });

  it('returns 400 for an invalid type query param', async () => {
    const center = await seedCenter();
    const res = await request(app)
      .get(`/api/getSlotsByCenter/${center._id.toString()}?type=WRONG`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid type/i);
  });

  it('returns empty list for center with no slots', async () => {
    const center = await seedCenter();
    const res = await request(app)
      .get(`/api/getSlotsByCenter/${center._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});

// =============================================================================
// GET /api/getAvailableAppointmentSlots/:centerId — getAvailableAppointmentSlots
// =============================================================================
describe('GET /api/getAvailableAppointmentSlots/:centerId', () => {
  it('returns available future slots for a valid centerId', async () => {
    const center = await seedCenter();
    await seedAvailableSlot(center._id); // Future slot, AVAILABLE

    const res = await request(app)
      .get(`/api/getAvailableAppointmentSlots/${center._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('availableSlots');
    expect(res.body.availableSlots.length).toBeGreaterThan(0);
  });

  it('returns empty array when no available slots exist', async () => {
    const center = await seedCenter();
    const res = await request(app)
      .get(`/api/getAvailableAppointmentSlots/${center._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.availableSlots).toHaveLength(0);
  });
});

// =============================================================================
// PUT /api/updateSlot/:id — updateAppointmentSlots
// =============================================================================
describe('PUT /api/updateSlot/:id', () => {
  it('returns 200 and updates the slot status', async () => {
    const center = await seedCenter();
    const slot = await seedAvailableSlot(center._id);

    const res = await request(app)
      .put(`/api/updateSlot/${slot._id.toString()}`)
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('returns 404 for a non-existent slot', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/updateSlot/${nonExistentId}`)
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});

// =============================================================================
// DELETE /api/deleteSlot/:id — deleteAppointmentSlot
// =============================================================================
describe('DELETE /api/deleteSlot/:id', () => {
  it('returns 200 and deletes an AVAILABLE future slot', async () => {
    const center = await seedCenter();
    const slot = await seedAvailableSlot(center._id); // future date, AVAILABLE

    const res = await request(app)
      .delete(`/api/deleteSlot/${slot._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deleted = await AppointmentSlot.findById(slot._id);
    expect(deleted).toBeNull();
  });

  it('returns 400 for an invalid slot ID format', async () => {
    const res = await request(app).delete('/api/deleteSlot/not-valid');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid slot id/i);
  });

  it('returns 404 for a slot that does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/api/deleteSlot/${nonExistentId}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns 400 when attempting to delete a BOOKED slot', async () => {
    const center = await seedCenter();
    const slot = await seedAvailableSlot(center._id, { status: 'BOOKED' });

    const res = await request(app)
      .delete(`/api/deleteSlot/${slot._id.toString()}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot delete a booked/i);
  });
});

// =============================================================================
// DELETE /api/deleteExpiredUnbooked — deleteExpiredUnbookedSlots
// =============================================================================
describe('DELETE /api/deleteExpiredUnbooked', () => {
  it('returns 400 when centerId is missing', async () => {
    const res = await request(app).delete('/api/deleteExpiredUnbooked');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid centerId', async () => {
    const res = await request(app)
      .delete('/api/deleteExpiredUnbooked?centerId=bad-id');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 with deletedCount 0 when no expired slots exist', async () => {
    const center = await seedCenter();
    const res = await request(app)
      .delete(`/api/deleteExpiredUnbooked?centerId=${center._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deletedCount).toBe(0);
  });

  it('deletes expired unbooked slots and returns 200', async () => {
    const center = await seedCenter();

    // Seed a slot in the past (expired)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    pastDate.setUTCHours(0, 0, 0, 0);

    await AppointmentSlot.create({
      center: center._id,
      slotDate: pastDate,
      startTime: '08:00',
      endTime: '08:30',
      status: 'AVAILABLE',
    });

    // Use a specific past date so the endpoint's date-range filter picks it up
    const dateStr = pastDate.toISOString().split('T')[0];

    const res = await request(app)
      .delete(`/api/deleteExpiredUnbooked?centerId=${center._id.toString()}&date=${dateStr}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deletedCount).toBeGreaterThan(0);
  });
});

// =============================================================================
// DELETE /api/deleteUpcomingUnbooked — deleteUpcomingUnbookedSlots
// =============================================================================
describe('DELETE /api/deleteUpcomingUnbooked', () => {
  it('returns 400 when centerId is missing', async () => {
    const res = await request(app).delete('/api/deleteUpcomingUnbooked');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when date query param is missing', async () => {
    const center = await seedCenter();
    const res = await request(app)
      .delete(`/api/deleteUpcomingUnbooked?centerId=${center._id.toString()}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/date query param/i);
  });

  it('returns 400 for an invalid centerId', async () => {
    const res = await request(app)
      .delete(`/api/deleteUpcomingUnbooked?centerId=bad-id&date=${futureDateString(1)}`);

    expect(res.status).toBe(400);
  });

  it('deletes upcoming unbooked slots for the given date', async () => {
    const center = await seedCenter();
    const targetDate = futureDateString(5);
    const targetUTC = new Date(`${targetDate}T00:00:00.000Z`);

    await AppointmentSlot.create({
      center: center._id,
      slotDate: targetUTC,
      startTime: '09:00',
      endTime: '09:30',
      status: 'AVAILABLE',
    });

    const res = await request(app)
      .delete(`/api/deleteUpcomingUnbooked?centerId=${center._id.toString()}&date=${targetDate}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deletedCount).toBe(1);
  });

  it('does not delete BOOKED slots', async () => {
    const center = await seedCenter();
    const user = await seedUser();
    const diagTest = await seedDiagnosticTest();
    const targetDate = futureDateString(5);
    const targetUTC = new Date(`${targetDate}T00:00:00.000Z`);

    const slot = await AppointmentSlot.create({
      center: center._id,
      slotDate: targetUTC,
      startTime: '09:00',
      endTime: '09:30',
      status: 'BOOKED',
      bookedBy: user._id,
    });
    await seedBooking(user._id, slot._id, center._id, diagTest._id);

    const res = await request(app)
      .delete(`/api/deleteUpcomingUnbooked?centerId=${center._id.toString()}&date=${targetDate}`);

    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(0);
    expect(res.body.failed.length).toBeGreaterThan(0);
    expect(res.body.failed[0].reason).toBe('BOOKED');
  });
});
