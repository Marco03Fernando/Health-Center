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

const { protect } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");


router.get("/test", (req, res) => {
  res.json({ ok: true });
});


router.post("/", protect, allowRoles("pharmacy", "PHARMACIST"), createMedication);
router.get("/", getAllMedications);


router.get("/:id", getMedicationById);
router.put("/:id", protect, allowRoles("pharmacy", "PHARMACIST"), updateMedication);
router.delete("/:id", protect, allowRoles("pharmacy", "PHARMACIST"), deleteMedication);


router.post(
  "/:id/batches",
  protect,
  allowRoles("pharmacy", "PHARMACIST"),
  addBatch
);
router.put(
  "/:id/batches/:batchId",
  protect,
  allowRoles("pharmacy", "PHARMACIST"),
  updateBatch
);
router.delete(
  "/:id/batches/:batchId",
  protect,
  allowRoles("pharmacy", "PHARMACIST"),
  deleteBatch
);

module.exports = router;