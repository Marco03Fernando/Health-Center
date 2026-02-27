const mongoose = require("mongoose");
const Appointment = require("../../models/doctorChanneling/appointment.model");
const Slot = require("../../models/doctorChanneling/slot.model");
const Doctor = require("../../models/doctorChanneling/doctor.model");
const ApiError = require("../../utils/ApiError");

async function create(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { centerId, doctorId, slotId, userId, note } = req.body;

    if (!centerId || !doctorId || !slotId || !userId) {
      throw new ApiError(400, "centerId, doctorId, slotId, userId are required");
    }

    // Validate ObjectIds (minimal + safe)
    if (!mongoose.Types.ObjectId.isValid(centerId)) throw new ApiError(400, "Invalid centerId");
    if (!mongoose.Types.ObjectId.isValid(doctorId)) throw new ApiError(400, "Invalid doctorId");
    if (!mongoose.Types.ObjectId.isValid(slotId)) throw new ApiError(400, "Invalid slotId");
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid userId");

    await session.withTransaction(async () => {
      // 1) Validate doctor
      const doctor = await Doctor.findById(doctorId).session(session);
      if (!doctor) throw new ApiError(404, "Doctor not found");
      if (String(doctor.centerId) !== String(centerId)) {
        throw new ApiError(400, "Doctor does not belong to this center");
      }
      if (doctor.isActive === false) {
        throw new ApiError(400, "Doctor is inactive");
      }

      // 2) Book slot atomically (only if active + not booked + correct doctor/center)
      const slot = await Slot.findOneAndUpdate(
        { _id: slotId, doctorId, centerId, isActive: true, isBooked: false },
        { $set: { isBooked: true } },
        { new: true, session }
      );

      if (!slot) {
        throw new ApiError(409, "Slot not available or already booked");
      }

      // 3) Create appointment (slotId unique prevents double booking at DB level too)
      const amount = Number(doctor.fee || 0);

      const apptDoc = {
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
      };

      await Appointment.create([apptDoc], { session });
    });

    // Fetch created appointment (optional, keeps your response same shape)
    const created = await Appointment.findOne({ slotId }).lean();
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return next(err);
  } finally {
    session.endSession();
  }
}

// User appointment list
async function listByUser(req, res, next) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid userId");
    }

    const items = await Appointment.find({ userId })
      .populate("doctorId", "name specialization clinic fee")
      .populate("centerId", "name district")
      .populate("slotId", "date startTime endTime")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

// Cancel appointment
async function cancel(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required in query" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid userId");
    }

    await session.withTransaction(async () => {
      const appt = await Appointment.findOne({ _id: req.params.id, userId }).session(session);
      if (!appt) throw new ApiError(404, "Appointment not found");

      if (["completed", "no_show"].includes(appt.status)) {
        throw new ApiError(400, "Cannot cancel a completed/no-show appointment");
      }

      // already cancelled -> return same
      if (appt.status !== "cancelled") {
        appt.status = "cancelled";
        appt.statusUpdatedAt = new Date();
        appt.statusUpdatedBy = "patient";
        await appt.save({ session });

        // Free slot (only flip if it exists; keep it safe)
        await Slot.updateOne(
          { _id: appt.slotId, isBooked: true },
          { $set: { isBooked: false } },
          { session }
        );
      }
    });

    const updated = await Appointment.findById(req.params.id).lean();
    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
}

// Mark appointment as paid
async function pay(req, res, next) {
  try {
    const { method } = req.body;
    const appt = await Appointment.findById(req.params.id);
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
    return res.json({ success: true, data: appt });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  listByUser,
  cancel,
  pay,
};