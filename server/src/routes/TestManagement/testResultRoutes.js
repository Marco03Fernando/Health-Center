const express = require("express");
const router = express.Router();
const testResultController = require("../../controllers/TestManagement/testResultController");

// CRUD routes
router.post("/", testResultController.createTestResult);
router.get("/", testResultController.getAllTestResults);
router.get("/patient/:patientId", testResultController.getTestResultsByPatientId);

// PDF route
router.get("/:id/pdf", testResultController.generateTestResultPdf);

// WhatsApp resend route
router.post("/:id/send-whatsapp", testResultController.sendTestResultWhatsApp);

router.get("/:id", testResultController.getTestResultById);
router.put("/:id", testResultController.updateTestResult);
router.delete("/:id", testResultController.deleteTestResult);

module.exports = router;