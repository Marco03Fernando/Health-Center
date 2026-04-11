const express = require("express");
const router = express.Router();

const controller = require("../../controllers/doctorChanneling/appointment.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { protectDoctorRoute } = require("../../middlewares/protectDoctorRoute");

// Booking
router.post("/", protect, controller.create);

// Patient appointment list
router.get("/user/:userId", protect, controller.listByUser);

// Logged-in doctor appointment list
router.get("/doctor/me", protectDoctorRoute, controller.listByDoctor);

// Doctor updates appointment status
router.patch("/:id/status", protectDoctorRoute, controller.updateAppointmentStatusByDoctor);

// Cancel appointment
router.delete("/:id/cancel", protect, controller.cancel);

module.exports = router;