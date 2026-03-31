const mongoose = require("mongoose");
const Center = require("../../models/doctorChanneling/center.model");

async function getCenters(req, res, next) {
  try {
    const centers = await Center.find({ isActive: true }).sort({ name: 1 });

    res.json({ success: true, data: centers });
  } catch (err) {
    next(err);
  }
}

async function getFeaturedCenters(req, res, next) {
  try {
    const limit = Number(req.query.limit || 5);

    const centers = await Center.find({ isActive: true, isFeatured: true })
      .sort({ displayOrder: 1, name: 1 })
      .limit(limit);

    res.json({ success: true, data: centers });
  } catch (err) {
    next(err);
  }
}

async function getAllCentersAdmin(req, res, next) {
  try {
    const centers = await Center.find({}).sort({ createdAt: -1, name: 1 });
    res.json({ success: true, data: centers });
  } catch (err) {
    next(err);
  }
}

async function createCenter(req, res, next) {
  try {
    const { name, address, district, phone, isActive, isFeatured, displayOrder } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: "Center name is required" });
    }

    const center = await Center.create({
      name: String(name).trim(),
      address: address ? String(address).trim() : "",
      district: district ? String(district).trim() : "",
      phone: phone ? String(phone).trim() : "",
      isActive: typeof isActive === "boolean" ? isActive : true,
      isFeatured: typeof isFeatured === "boolean" ? isFeatured : false,
      displayOrder: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 999,
    });

    res.status(201).json({
      success: true,
      message: "Center created successfully",
      data: center,
    });
  } catch (err) {
    next(err);
  }
}

async function updateCenter(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid center id" });
    }

    const updates = {};
    const allowedFields = ["name", "address", "district", "phone", "isActive", "isFeatured", "displayOrder"];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) updates.name = String(updates.name).trim();
    if (updates.address !== undefined) updates.address = String(updates.address).trim();
    if (updates.district !== undefined) updates.district = String(updates.district).trim();
    if (updates.phone !== undefined) updates.phone = String(updates.phone).trim();
    if (updates.displayOrder !== undefined) updates.displayOrder = Number(updates.displayOrder);

    const center = await Center.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!center) {
      return res.status(404).json({ success: false, message: "Center not found" });
    }

    res.json({
      success: true,
      message: "Center updated successfully",
      data: center,
    });
  } catch (err) {
    next(err);
  }
}

async function toggleCenterActive(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid center id" });
    }

    const center = await Center.findById(id);

    if (!center) {
      return res.status(404).json({ success: false, message: "Center not found" });
    }

    center.isActive = !center.isActive;
    await center.save();

    res.json({
      success: true,
      message: `Center ${center.isActive ? "activated" : "deactivated"} successfully`,
      data: center,
    });
  } catch (err) {
    next(err);
  }
}

async function toggleCenterFeatured(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid center id" });
    }

    const center = await Center.findById(id);

    if (!center) {
      return res.status(404).json({ success: false, message: "Center not found" });
    }

    center.isFeatured = !center.isFeatured;
    await center.save();

    res.json({
      success: true,
      message: `Center ${center.isFeatured ? "featured" : "unfeatured"} successfully`,
      data: center,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCenters,
  getFeaturedCenters,
  getAllCentersAdmin,
  createCenter,
  updateCenter,
  toggleCenterActive,
  toggleCenterFeatured,
};