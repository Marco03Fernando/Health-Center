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

function createTestApp() {
  const app = express();

  app.use(express.json());

  // Lab booking endpoints (mounted at root — paths like /api/bookappointment)
  app.use(labAppointmentRoutes);

  // Slot management endpoints (mounted at root — paths like /api/generateSlots)
  app.use(labSlotRoutes);

  // Diagnostic-test endpoints (mounted under /api/lab/diagnostic-tests)
  app.use('/api/lab/diagnostic-tests', diagnosticTestRoutes);

  // Pharmacy endpoints
  app.use('/api/medication-inventory', medicationInventoryRoutes);
  app.use('/api/pharmacy-orders', pharmacyOrderRoutes);

  // Centralised error handler (used by controllers that call next(err))
  app.use(errorMiddleware);

  return app;
}

module.exports = createTestApp;
