const mongoose = require("mongoose");

const Appointment = require("./appointment.model");
const Slot = require("../slot/slot.model");
const Doctor = require("../doctor/doctor.model");

const ApiError = require("../../../utils/ApiError");

// ============================
// BOOK (NO LOGIN YET): Create appointment using userId from body
// payload: { centerId, doctorId, slotId, userId, note }
// ============================
async function createAppointment(payload) {
  const { centerId, doctorId, slotId, userId, note } = payload;

  if (!centerId || !doctorId || !slotId || !userId) {
    throw new ApiError(400, "centerId, doctorId, slotId, userId are required");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  // Validate doctor exists + belongs to center
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ApiError(404, "Doctor not found");
  if (String(doctor.centerId) !== String(centerId)) {
    throw new ApiError(400, "Doctor does not belong to this center");
  }

  // Atomically book slot (prevents double booking)
  const slot = await Slot.findOneAndUpdate(
    { _id: slotId, doctorId, centerId, isBooked: false },
    { $set: { isBooked: true } },
    { new: true }
  );

  if (!slot) {
    throw new ApiError(409, "Slot not available or already booked");
  }

  const amount = Number(doctor.fee || 0);

  const appt = await Appointment.create({
    centerId,
    doctorId,
    userId,
    slotId,
    note: note || "",

    status: "pending",
    statusUpdatedAt: new Date(),
    statusUpdatedBy: "patient",

    payment: {
      status: "unpaid",
      method: "cash",
      amount,
      currency: "LKR",
    },
  });

  return appt;
}

// ============================
// USER (NO LOGIN YET): List appointments by userId
// ============================
async function listUserAppointments(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const items = await Appointment.find({ userId })
    .populate("doctorId", "name specialization clinic fee")
    .populate("centerId", "name district")
    .populate("slotId", "date startTime endTime")
    .sort({ createdAt: -1 });

  return items;
}

// ============================
// USER (NO LOGIN YET): Cancel appointment by userId
// ============================
async function cancelUserAppointment(userId, appointmentId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const appt = await Appointment.findOne({ _id: appointmentId, userId });
  if (!appt) throw new ApiError(404, "Appointment not found");

  if (["completed", "no_show"].includes(appt.status)) {
    throw new ApiError(400, "Cannot cancel a completed/no-show appointment");
  }

  appt.status = "cancelled";
  appt.statusUpdatedAt = new Date();
  appt.statusUpdatedBy = "patient";
  await appt.save();

  // Free slot
  await Slot.updateOne({ _id: appt.slotId }, { $set: { isBooked: false } });

  return appt;
}

// ============================
// DOCTOR AUTH HELPERS (keep as-is for later login)
// ============================
async function getDoctorProfileByAuth(authUserId) {
  const doctor = await Doctor.findOne({ authUserId });
  if (!doctor) throw new ApiError(403, "Doctor profile not found for this account");
  return doctor;
}

// =========================================
// DOCTOR: List my appointments (optional - auth later)
// =========================================
async function listDoctorAppointments(authUserId, filters) {
  const doctor = await getDoctorProfileByAuth(authUserId);

  const query = { doctorId: doctor._id };
  if (filters.status) query.status = filters.status;

  const items = await Appointment.find(query)
    .populate("userId", "fullName phone email")
    .populate("centerId", "name")
    .populate("slotId", "date startTime endTime")
    .sort({ createdAt: -1 });

  if (filters.date) {
    return items.filter((a) => a.slotId && a.slotId.date === filters.date);
  }

  return items;
}

// =====================================
// DOCTOR: Update status (completed/no_show) (auth later)
// =====================================
async function updateAppointmentStatusByDoctor(authUserId, appointmentId, status) {
  const doctor = await getDoctorProfileByAuth(authUserId);

  const allowed = ["confirmed", "completed", "no_show"];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${allowed.join(", ")}`);
  }

  const appt = await Appointment.findOne({ _id: appointmentId, doctorId: doctor._id });
  if (!appt) throw new ApiError(404, "Appointment not found for this doctor");

  appt.status = status;
  appt.statusUpdatedAt = new Date();
  appt.statusUpdatedBy = "doctor";
  await appt.save();

  return appt;
}

// =====================================
// RECEPTIONIST: Mark paid (ONLY)
// =====================================
async function markAppointmentPaid({ appointmentId, method }) {
  const allowedMethods = ["cash", "card", "online"];
  if (method && !allowedMethods.includes(method)) {
    throw new ApiError(400, "Invalid payment method");
  }

  const appt = await Appointment.findById(appointmentId);
  if (!appt) throw new ApiError(404, "Appointment not found");

  if (appt.status === "cancelled") throw new ApiError(400, "Cannot pay for a cancelled appointment");
  if (appt.status === "no_show") throw new ApiError(400, "Cannot pay for a no-show appointment");

  if (appt.payment?.status === "paid") {
    throw new ApiError(400, "Appointment is already paid");
  }

  appt.payment.status = "paid";
  appt.payment.method = method || appt.payment.method || "cash";
  appt.payment.paidAt = new Date();
  appt.payment.paidBy = "receptionist";

  if (appt.status === "pending") appt.status = "confirmed";

  appt.statusUpdatedAt = new Date();
  appt.statusUpdatedBy = "receptionist";

  await appt.save();
  return appt;
}

module.exports = {
  // ✅ no-login booking for now
  createAppointment,
  listUserAppointments,
  cancelUserAppointment,

  // keep existing (for later)
  listDoctorAppointments,
  updateAppointmentStatusByDoctor,
  markAppointmentPaid,
};
