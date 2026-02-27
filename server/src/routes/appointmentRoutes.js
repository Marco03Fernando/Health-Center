const express = require('express');
const router = express.Router();
const { createAppointment } = require('../controllers/appoinment/appointmentsController');

router.post('/api/appointments', createAppointment);

module.exports = router;
