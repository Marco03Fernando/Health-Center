const express = require("express");
const doctorController = require("../../controllers/doctorChanneling/doctor.controller");
const {protectSession }= require("../../middlewares/protectSession.middleware"); // Session protection
const { allowRoles } = require("../../middlewares/role.middleware"); // Role-based authorization

const router = express.Router();

// Public doctor browsing
router.get("/", doctorController.list);
router.get("/:id", doctorController.getById);

// For the logged-in doctor
router.get("/me", protectSession, allowRoles("doctor"), doctorController.getMe);
router.patch("/me", protectSession, allowRoles("doctor"), doctorController.updateProfile);

module.exports = router;