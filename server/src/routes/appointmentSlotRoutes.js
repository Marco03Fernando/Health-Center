const express = require('express');
const router = express.Router();
const { generateAppointmentSlots , updateAppointmentSlots , getAppointmentSlots , getAvailableAppointmentSlots , deleteAppointmentSlot} = require('../controllers/appoinment/appointmentSlotsController');


router.post('/api/generateSlots', generateAppointmentSlots);
router.put('/api/updateSlot/:id', updateAppointmentSlots);
router.get('/api/getSlots', getAppointmentSlots);
router.get('/api/getAvailableAppointmentSlots/:centerId', getAvailableAppointmentSlots);
router.delete('/api/deleteSlot/:id', deleteAppointmentSlot);


module.exports = router;
