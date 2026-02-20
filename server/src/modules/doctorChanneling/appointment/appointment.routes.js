const express = require("express");
const router = express.Router();

const controller = require("./appointment.controller");

// Booking (no login yet)
router.post("/", controller.create);

// User appointment list (no login yet)
router.get("/user/:userId", controller.listByUser);

// Cancel appointment (no login yet)
// Example: PATCH /api/appointments/<id>/cancel?userId=<userId>
router.patch("/:id/cancel", controller.cancel);

// Receptionist payment (no auth yet; later you will protect with receptionist role)
router.patch("/:id/pay", controller.pay);

// OPTIONAL doctor testing without login
router.get("/doctor/:doctorId", controller.listByDoctor);
router.patch("/doctor/:doctorId/:id/status", controller.doctorUpdateStatus);

module.exports = router;
