const express = require("express");
const router = express.Router();

const controller = require("../../controllers/doctorChanneling/appointment.controller");
const { protectDoctorRoute } = require("../../middlewares/protectDoctorRoute");

// Booking
router.post("/", controller.create);

// Logged-in doctor appointment list
router.get("/doctor/me", protectDoctorRoute, controller.listByDoctor);

// Doctor updates appointment status
router.patch("/:id/status", protectDoctorRoute, controller.updateAppointmentStatusByDoctor);

// Cancel appointment
router.delete("/:id/cancel", controller.cancel);

// Receptionist payment
// router.patch("/:id/pay", controller.pay);

module.exports = router;