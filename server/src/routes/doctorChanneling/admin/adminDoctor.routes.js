const express = require("express");
const router = express.Router();
const doctorController = require("../../../controllers/doctorChanneling/doctor.controller");
const { protect } = require("../../../middlewares/auth.middleware");
const { allowRoles } = require("../../../middlewares/role.middleware");

// Admin doctor management
router.post("/", protect, allowRoles("admin", "superadmin"), doctorController.create);
router.get("/", protect, allowRoles("admin", "superadmin"), doctorController.list);
router.get("/:id", protect, allowRoles("admin", "superadmin"), doctorController.getById);
router.patch("/:id", protect, allowRoles("admin", "superadmin"), doctorController.update);
router.patch("/:id/active", protect, allowRoles("admin", "superadmin"), doctorController.setActive);

// Manual slot maintenance
router.post(
  "/generate-upcoming-slots",
  protect,
  allowRoles("admin", "superadmin"),
  doctorController.generateUpcomingSlots
);

router.post(
  "/cleanup-expired-slots",
  protect,
  allowRoles("admin", "superadmin"),
  doctorController.cleanupExpiredSlots
);

module.exports = router;