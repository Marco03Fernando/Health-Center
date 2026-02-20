const Center = require("./center.model");

async function listCenters() {
  return Center.find({ isActive: true }).sort({ name: 1 });
}

async function listFeaturedCenters(limit = 5) {
  return Center.find({ isActive: true, isFeatured: true })
    .sort({ displayOrder: 1, name: 1 })
    .limit(limit);
}

module.exports = { listCenters, listFeaturedCenters };
