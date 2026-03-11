const express = require("express");
const router = express.Router();

const controller = require("../../controllers/doctorChanneling/prescription.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware"); // Import allowRoles middleware

// Create prescription - doctor only
router.post("/", protect, allowRoles("doctor"), controller.create);

// PDF download - doctor, patient, pharmacy, and admin
router.get("/:id/pdf", protect, allowRoles("doctor", "patient", "pharmacy", "admin"), controller.downloadPdf);

// Get one prescription - doctor, patient, pharmacy, admin
router.get("/:id", protect, allowRoles("doctor", "patient", "pharmacy", "admin"), controller.getById);

// List prescriptions - doctor, pharmacy, admin
router.get("/", protect, allowRoles("doctor", "pharmacy", "admin"), controller.list);

// Pharmacy dispense - pharmacy only
router.patch("/:id/dispense", protect, allowRoles("pharmacy", "admin"), controller.markDispensed);

module.exports = router;