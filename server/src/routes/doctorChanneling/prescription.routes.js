const express = require("express");
const router = express.Router();

const controller = require("../../controllers/doctorChanneling/prescription.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");
const { protectDoctorRoute } = require("../../middlewares/protectDoctorRoute");

// Doctor frontend
router.get("/doctor/me", protectDoctorRoute, controller.listByDoctor);

// List prescriptions - patient can only see own prescriptions (handled in controller)
router.get(
  "/",
  protect,
  allowRoles("doctor", "patient", "pharmacy", "admin", "superadmin"),
  controller.list
);

// Create prescription - doctor only
router.post("/", protect, allowRoles("doctor"), controller.create);

// PDF download - doctor, patient, pharmacy, admin, superadmin
router.get(
  "/:id/pdf",
  protect,
  allowRoles("doctor", "patient", "pharmacy", "admin", "superadmin"),
  controller.downloadPdf
);

// Get one prescription - doctor, patient, pharmacy, admin, superadmin
router.get(
  "/:id",
  protect,
  allowRoles("doctor", "patient", "pharmacy", "admin", "superadmin"),
  controller.getById
);

// Pharmacy dispense - pharmacy, admin, superadmin
router.patch(
  "/:id/dispense",
  protect,
  allowRoles("pharmacy", "admin", "superadmin"),
  controller.markDispensed
);

module.exports = router;