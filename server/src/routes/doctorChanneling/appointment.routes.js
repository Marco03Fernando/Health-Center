const express = require("express");
const router = express.Router();

const controller = require("../../controllers/doctorChanneling/appointment.controller");

// Booking (no login yet)
router.post("/", controller.create);

// User appointment list (no login yet)
router.get("/user/:userId", controller.listByUser);

// Cancel appointment (no login yet)
router.delete("/:id/cancel", controller.cancel);

// Receptionist payment 
//router.patch("/:id/pay", controller.pay);



module.exports = router;