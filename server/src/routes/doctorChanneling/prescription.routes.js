const express = require("express");
const router = express.Router();

const controller = require("../../controllers/doctorChanneling/prescription.controller");

// Create prescription
router.post("/", controller.create);

//  PDF download MUST be before "/:id"
router.get("/:id/pdf", controller.downloadPdf);

// Get one
router.get("/:id", controller.getById);

// List
router.get("/", controller.list);

// Pharmacy dispense
router.patch("/:id/dispense", controller.markDispensed);

module.exports = router;