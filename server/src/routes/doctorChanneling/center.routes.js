const express = require("express");
const router = express.Router();
const { getCenters, getFeaturedCenters } = require("../../controllers/doctorChanneling/center.controller");

router.get("/", getCenters);
router.get("/featured", getFeaturedCenters);

module.exports = router;
