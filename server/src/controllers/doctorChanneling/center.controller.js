const Center = require("../../models/doctorChanneling/center.model");
const mongoose = require("mongoose");

async function getCenters(req, res, next) {
  try {
    const centers = await Center.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: centers });
  } catch (err) {
    next(err);
  }
}

async function getCenterById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid center ID",
      });
    }

    const center = await Center.findById(id);

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "Center not found",
      });
    }

    res.json({ success: true, data: center });
  } catch (err) {
    next(err);
  }
}

async function getFeaturedCenters(req, res, next) {
  try {
    const limit = Number(req.query.limit || 5);
    // Directly using the service logic for listFeaturedCenters
    const centers = await Center.find({ isActive: true, isFeatured: true })
      .sort({ displayOrder: 1, name: 1 })
      .limit(limit);
    res.json({ success: true, data: centers });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCenters, getCenterById, getFeaturedCenters };