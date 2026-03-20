const express = require('express');
const router = express.Router();
const { bookAppointment, updateAppointment , deleteAppointment , getAllAppointmentsAdmin ,getCenterAppointments } = require('../controllers/appoinment/bookingController');

router.post('/api/bookappointment', bookAppointment);
router.put('/api/updateappointment/:bookingId', updateAppointment)
router.delete('/api/deleteappointment/:bookingId', deleteAppointment)
router.get('/api/getappointments/:centerId', getCenterAppointments);
router.get('/api/getallappointments', getAllAppointmentsAdmin);


module.exports = router;
