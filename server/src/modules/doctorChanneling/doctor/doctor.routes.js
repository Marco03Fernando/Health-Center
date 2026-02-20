const express = require("express");
const doctorController = require("../doctor/doctor.controller");

const router = express.Router();

// CRUD
router.post("/", doctorController.create);

// List for channeling UI:
// /api/doctors?centerId=...&specialization=...&clinic=...&q=...&isActive=true&page=1&limit=20
router.get("/", doctorController.list);

router.get("/:id", doctorController.getById);
router.patch("/:id", doctorController.update);

// Activate/deactivate
router.patch("/:id/active", doctorController.setActive);

module.exports = router;
