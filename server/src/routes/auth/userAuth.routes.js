const express = require("express");
const router = express.Router();

const { registerPatient, loginUser, getMe, changePassword, logoutUser } = require("../../controllers/auth/userAuth.controller");
const { protectSession } = require("../../middlewares/protectSession.middleware");  // Protect session
console.log('protectSession middleware:', protectSession); 

router.post("/register", registerPatient);
router.post("/login", loginUser);
router.post("/logout", logoutUser); // Add this route to your router
router.get("/me", protectSession, getMe);  // Protect route with session
router.patch("/change-password", protectSession, changePassword);  // Protect route with session

module.exports = router;