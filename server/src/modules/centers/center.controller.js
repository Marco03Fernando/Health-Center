const { listCenters, listFeaturedCenters } = require("./center.service");

async function getCenters(req, res, next) {
  try {
    const centers = await listCenters();
    res.json({ success: true, data: centers });
  } catch (err) {
    next(err);
  }
}

async function getFeaturedCenters(req, res, next) {
  try {
    const limit = Number(req.query.limit || 5);
    const centers = await listFeaturedCenters(limit);
    res.json({ success: true, data: centers });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCenters, getFeaturedCenters };
