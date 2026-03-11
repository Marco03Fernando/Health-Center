const express = require("express");
const router = express.Router();

const {
  registerPatient,
  loginUser,
  getMe,
  changePassword,
} = require("../../controllers/auth/userAuth.controller");

const { protect } = require("../../middlewares/auth.middleware");

router.post("/register", registerPatient);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.patch("/change-password", protect, changePassword);

module.exports = router;