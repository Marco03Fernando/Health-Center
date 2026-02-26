const express = require("express");
const doctorController = require("../doctor/doctor.controller");

const router = express.Router();

// CRUD operations for doctor management
router.post("/", doctorController.create);  // Create a new doctor

// List doctors with filters for channeling UI
router.get("/", doctorController.list);    // Get a list of doctors with query parameters

router.get("/:id", doctorController.getById);   // Get a specific doctor by ID
router.patch("/:id", doctorController.update);  // Update doctor details

// Activate or deactivate the doctor
router.patch("/:id/active", doctorController.setActive);

module.exports = router;