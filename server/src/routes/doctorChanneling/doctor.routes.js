const express = require("express");
const doctorController = require("../../controllers/doctorChanneling/doctor.controller");
const {
  protectDoctorRoute,
} = require("../../middlewares/protectDoctorRoute");

const router = express.Router();

// For the logged-in doctor
router.get("/me", protectDoctorRoute, doctorController.getMe);
router.patch("/me", protectDoctorRoute, doctorController.updateProfile);

// Public doctor browsing
router.get("/", doctorController.list);
router.get("/:id", doctorController.getById);

module.exports = router;