const mongoose = require("mongoose");
const Doctor = require("./doctor.model");

function assertObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error(`Invalid ${name}`);
        error.status = 400;
        throw error;
    }
}

async function createDoctor(payload) { //payload means like req.body "data being sent" "cool developer shit"
    const doctor = await Doctor.create(payload);
    return doctor.toObject();
}

async function getDoctorById(id) {
  assertObjectId(id, "doctor id");

  const doctor = await Doctor.findById(id).lean();
  if (!doctor) {
    const err = new Error("Doctor not found");
    err.status = 404;
    throw err;
  }
  return doctor;
}


async function listDoctors(query) {
  const {
    centerId,
    specialization,
    clinic,
    isActive,
    q,
    page = 1,
    limit = 20,
  } = query;

  const filter = {};

  if (centerId) {
    assertObjectId(centerId, "centerId");
    filter.centerId = centerId;
  }
  if (specialization) filter.specialization = specialization;
  if (clinic) filter.clinic = clinic;

  // default to active doctors for channeling UI
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

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

async function updateDoctor(id, patch) {
  assertObjectId(id, "doctor id");

  // prevent changing _id
  if ("_id" in patch) delete patch._id;

  const updated = await Doctor.findByIdAndUpdate(
    id,
    { $set: patch },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    const err = new Error("Doctor not found");
    err.status = 404;
    throw err;
  }
  return updated;
}

async function setDoctorActive(id, isActive) {
  assertObjectId(id, "doctor id");

  const updated = await Doctor.findByIdAndUpdate(
    id,
    { $set: { isActive: !!isActive } },
    { new: true }
  ).lean();

  if (!updated) {
    const err = new Error("Doctor not found");
    err.status = 404;
    throw err;
  }
  return updated;
}

module.exports = {
  createDoctor,
  getDoctorById,
  listDoctors,
  updateDoctor,
  setDoctorActive,
};