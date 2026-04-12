/**
 * Builds a minimal Express application for integration tests.
 *
 * Deliberately avoids:
 *  - MongoDB session store (connect-mongo) — tests use in-memory DB managed by Jest
 *  - The startup DB-connection / slot-scheduler logic from server.js
 *
 * All real controllers, services and Mongoose models are loaded as-is so the
 * full controller → model → DB path is exercised.
 */
const express = require('express');
const errorMiddleware = require('../../src/middlewares/error.middleware');
const diagnosticTestRoutes = require('../../src/routes/appointment/diagnosticTest.routes');
const labAppointmentRoutes = require('../../src/routes/appointment/appointmentRoutes');
const labSlotRoutes = require('../../src/routes/appointment/appointmentSlotRoutes');
const medicationInventoryRoutes = require('../../src/routes/pharmacy/medicationInventoryRoutes');
const pharmacyOrderRoutes = require('../../src/routes/pharmacy/pharmacyOrderRoutes');
const session = require('express-session');
const userAuthRoutes = require('../../src/routes/auth/userAuth.routes');
const testTypeRoutes = require('../../src/routes/TestManagement/testTypeRoutes');
const testResultRoutes = require('../../src/routes/TestManagement/testResultRoutes');
const centerRoutes = require('../../src/routes/doctorChanneling/center.routes');
const doctorRoutes = require('../../src/routes/doctorChanneling/doctor.routes');
const slotRoutes = require('../../src/routes/doctorChanneling/slot.routes');
const appointmentRoutes = require('../../src/routes/doctorChanneling/appointment.routes');
const adminDoctorRoutes = require('../../src/routes/doctorChanneling/admin/adminDoctor.routes');
const adminAuthRoutes = require('../../src/routes/auth/adminAuth.routes');

function createTestApp() {
  const app = express();

  app.use(express.json());

  // Lightweight session middleware for tests (uses default MemoryStore)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'test_secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    })
  );

  // Lab booking endpoints (mounted at root — paths like /api/bookappointment)
  app.use(labAppointmentRoutes);

  // Slot management endpoints (mounted at root — paths like /api/generateSlots)
  app.use(labSlotRoutes);

  // Diagnostic-test endpoints (mounted under /api/lab/diagnostic-tests)
  app.use('/api/lab/diagnostic-tests', diagnosticTestRoutes);

  // Auth endpoints (mounted at /api/auth)
  app.use('/api/auth', userAuthRoutes);

  // TestManagement endpoints
  app.use('/api/test-types', testTypeRoutes);
  app.use('/api/test-results', testResultRoutes);

  // Doctor channeling endpoints (centers, doctors, slots, appointments)
  app.use('/api/centers', centerRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/slots', slotRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/admin/doctors', adminDoctorRoutes);
  app.use('/api/admin/auth', adminAuthRoutes);

  // Pharmacy endpoints
  app.use('/api/medication-inventory', medicationInventoryRoutes);
  app.use('/api/pharmacy-orders', pharmacyOrderRoutes);

  // Centralised error handler (used by controllers that call next(err))
  app.use(errorMiddleware);

  return app;
}

module.exports = createTestApp;
