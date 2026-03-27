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
} = require("../../controllers/pharmacy/medicationInventoryController");


router.get("/test", (req, res) => {
  res.json({ ok: true });
});


router.post("/", createMedication);
router.get("/", getAllMedications);


router.get("/:id", getMedicationById);
router.put("/:id", updateMedication);
router.delete("/:id", deleteMedication);


router.post("/:id/batches", addBatch);
router.put("/:id/batches/:batchId", updateBatch);
router.delete("/:id/batches/:batchId", deleteBatch);

module.exports = router;