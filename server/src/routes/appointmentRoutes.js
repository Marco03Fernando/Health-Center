const express = require('express');
const router = express.Router();
const { createAppointment } = require('../controllers/appointmentsController');

router.post('/api/appointments', createAppointment);

module.exports = router;
