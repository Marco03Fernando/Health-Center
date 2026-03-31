const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  loginAdmin,
  getAdminMe,
} = require("../../controllers/auth/Doc_adminAuth.controller");

const { protect } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/me", protect, allowRoles("admin", "superadmin"), getAdminMe);

module.exports = router;