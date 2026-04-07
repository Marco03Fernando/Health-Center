const express = require("express");
const router = express.Router();
const {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
} = require("../../controllers/appoinment/diagnosticTest.controller");

// Public routes
router.get("/", getAllTests);
router.get("/:id", getTestById);

// Admin routes (no auth middleware for now)
router.post("/", createTest);
router.put("/:id", updateTest);
router.delete("/:id", deleteTest);

module.exports = router;
