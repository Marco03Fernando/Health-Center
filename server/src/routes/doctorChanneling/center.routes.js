const express = require("express");
const router = express.Router();
const { getCenters, getCenterById, getFeaturedCenters } = require("../../controllers/doctorChanneling/center.controller");

router.get("/", getCenters);
router.get("/featured", getFeaturedCenters);
router.get("/:id", getCenterById);

module.exports = router;
