const express = require("express");
const router = express.Router();

const {
  getCenters,
  getFeaturedCenters,
  getAllCentersAdmin,
  createCenter,
  updateCenter,
  toggleCenterActive,
  toggleCenterFeatured,
} = require("../../controllers/doctorChanneling/center.controller");

const { protect } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

// Public
router.get("/", getCenters);
router.get("/featured", getFeaturedCenters);

// Admin
router.get("/admin/all", protect, allowRoles("admin", "superadmin"), getAllCentersAdmin);
router.post("/admin", protect, allowRoles("admin", "superadmin"), createCenter);
router.patch("/admin/:id", protect, allowRoles("admin", "superadmin"), updateCenter);
router.patch("/admin/:id/active", protect, allowRoles("admin", "superadmin"), toggleCenterActive);
router.patch("/admin/:id/featured", protect, allowRoles("admin", "superadmin"), toggleCenterFeatured);

module.exports = router;