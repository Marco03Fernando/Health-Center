const Center = require("../../models/doctorChanneling/center.model");

async function getCenters(req, res, next) {
  try {
    // Directly using the service logic for listCenters
    const centers = await Center.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: centers });
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

module.exports = { getCenters, getFeaturedCenters };