const express = require("express");
const router = express.Router();

const {
  createMedication,
  getAllMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  addBatch,
  updateBatch,
  deleteBatch,
} = require("../controllers/pharmacy/medicationInventoryController");

// TEST ROUTE FIRST
router.get("/test", (req, res) => {
  res.json({ ok: true });
});

// Medication CRUD
router.post("/", createMedication);
router.get("/", getAllMedications);

// ⚠️ dynamic routes AFTER fixed routes
router.get("/:id", getMedicationById);
router.put("/:id", updateMedication);
router.delete("/:id", deleteMedication);

// Batch operations
router.post("/:id/batches", addBatch);
router.put("/:id/batches/:batchId", updateBatch);
router.delete("/:id/batches/:batchId", deleteBatch);

module.exports = router;