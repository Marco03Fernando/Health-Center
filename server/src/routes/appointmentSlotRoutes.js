const express = require('express');
const router = express.Router();
const {
  generateAppointmentSlots,
  updateAppointmentSlots,
  getAppointmentSlots,
  getAppointmentSlotsByCenterId,
  getAvailableAppointmentSlots,
  deleteAppointmentSlot,
  deleteExpiredUnbookedSlots,
  deleteUpcomingUnbookedSlots
} = require('../controllers/appoinment/appointmentSlotsController');


router.post('/api/generateSlots', generateAppointmentSlots);
router.put('/api/updateSlot/:id', updateAppointmentSlots);
router.get('/api/getSlots', getAppointmentSlots);
router.get('/api/getSlotsByCenter/:centerId', getAppointmentSlotsByCenterId);
router.get('/api/getAvailableAppointmentSlots/:centerId', getAvailableAppointmentSlots);
router.delete('/api/deleteSlot/:id', deleteAppointmentSlot);
router.delete('/api/deleteExpiredUnbooked', deleteExpiredUnbookedSlots);
router.delete('/api/deleteUpcomingUnbooked', deleteUpcomingUnbookedSlots);


module.exports = router;
