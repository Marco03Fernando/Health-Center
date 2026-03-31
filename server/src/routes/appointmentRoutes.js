const express = require('express');
const router = express.Router();

const {
  create,       
  listByUser,   
  cancel,       
  pay,          
  updateStatus,
  getAllAppointments
} = require('../controllers/appoinment/appointmentsController');


router.post('/api/bookappointment', create);
router.get('/api/user-appointments/:userId', listByUser);
router.delete('/api/cancel-appointment/:id', cancel);
router.put('/api/pay-appointment/:id', pay);
router.put('/api/update-status/:id', updateStatus);
router.get('/api/getallappointments', getAllAppointments);


module.exports = router;