const express = require('express');
const router = express.Router();
const { bookAppointment, updateAppointment, deleteAppointment, getAllAppointmentsAdmin, getCenterAppointments, getAppointmentById, getUserAppointments } = require('../controllers/appoinment/bookingController');

router.post('/api/bookappointment', bookAppointment);
router.get('/api/appointment/:bookingId', getAppointmentById);
router.get('/api/user-appointments/:userId', getUserAppointments);
router.put('/api/updateappointment/:bookingId', updateAppointment);
router.delete('/api/deleteappointment/:bookingId', deleteAppointment);
router.get('/api/getappointments/:centerId', getCenterAppointments);
router.get('/api/getallappointments', getAllAppointmentsAdmin);

module.exports = router;