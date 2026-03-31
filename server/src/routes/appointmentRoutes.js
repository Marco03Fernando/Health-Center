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


router.post('/api/bookappointment', create);
router.get('/api/user-appointments/:userId', listByUser);
router.delete('/api/cancel-appointment/:id', cancel);
router.put('/api/pay-appointment/:id', pay);
router.put('/api/update-status/:id', updateStatus);
router.get('/api/getallappointments', getAllAppointments);


module.exports = router;