const express = require('express');
const router = express.Router();
const { generateAppointmentSlots } = require('../controllers/appointmentSlotsController');

router.post('/api/generateSlots', generateAppointmentSlots);

module.exports = router;
