const express = require("express");
const doctorController = require("../../controllers/doctorChanneling/doctor.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware"); // Import allowRoles middleware

const router = express.Router();

// Public doctor browsing
router.get("/", doctorController.list);
router.get("/:id", doctorController.getById);

// For the logged-in doctor
router.get("/me", protect, allowRoles("doctor"), doctorController.getMe); // Only doctors can access their profile
router.patch("/me", protect, allowRoles("doctor"), doctorController.updateProfile); // Only doctors can update their profile

module.exports = router;