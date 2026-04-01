const express = require("express");
const router = express.Router();
const {
  createTestType,
  getAllTestTypes,
  getTestTypeById,
  updateTestType,
  deleteTestType,
} = require("../../controllers/TestManagement/testTypeController");

router.post("/", createTestType);
router.get("/", getAllTestTypes);
router.get("/:id", getTestTypeById);
router.put("/:id", updateTestType);
router.delete("/:id", deleteTestType);

module.exports = router;