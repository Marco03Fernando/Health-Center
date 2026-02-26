const mongoose = require("mongoose");
const Doctor = require("./doctor.model");

function assertObjectId(id, name = "id") {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error(`Invalid ${name}`);
        error.status = 400;
        throw error;
    }
}

// Controller Method for Creating a Doctor
async function create(req, res) {
  try {
    const { name, centerId, specialization, clinic, isActive } = req.body;

    // Create the doctor using the provided payload (from request body)
    const doctor = await Doctor.create({
      name,
      centerId,
      specialization,
      clinic,
      isActive: isActive || true,
    });

    return res.status(201).json({ doctor });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// Controller Method for Getting a Doctor by ID
async function getById(req, res) {
  try {
    const { id } = req.params;
    assertObjectId(id, "doctor id");

    // Fetch doctor by ID
    const doctor = await Doctor.findById(id).lean();
    if (!doctor) {
      const err = new Error("Doctor not found");
      err.status = 404;
      throw err;
    }

    return res.json({ doctor });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// Controller Method for Listing Doctors (with filters)
async function list(req, res) {
  try {
    const {
      centerId,
      specialization,
      clinic,
      isActive,
      q,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (centerId) {
      assertObjectId(centerId, "centerId");
      filter.centerId = centerId;
    }
    if (specialization) filter.specialization = specialization;
    if (clinic) filter.clinic = clinic;
    if (isActive === undefined) filter.isActive = true;
    else filter.isActive = isActive === "true";

    if (q) filter.name = { $regex: q, $options: "i" };

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      Doctor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
      Doctor.countDocuments(filter),
    ]);

    return res.json({
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// Controller Method for Updating a Doctor
async function update(req, res) {
  try {
    const { id } = req.params;
    const { name, centerId, specialization, clinic, isActive } = req.body;
    assertObjectId(id, "doctor id");

    // Prevent changing _id field
    const patch = { name, centerId, specialization, clinic, isActive };

    // Update the doctor's details
    const updated = await Doctor.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
    if (!updated) {
      const err = new Error("Doctor not found");
      err.status = 404;
      throw err;
    }

    return res.json({ doctor: updated });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// Controller Method for Setting Doctor's Active Status
async function setActive(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body; // true/false
    assertObjectId(id, "doctor id");

    // Set doctor's active status
    const updated = await Doctor.findByIdAndUpdate(id, { $set: { isActive: !!isActive } }, { new: true }).lean();
    if (!updated) {
      const err = new Error("Doctor not found");
      err.status = 404;
      throw err;
    }

    return res.json({ doctor: updated });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = { create, getById, list, update, setActive };