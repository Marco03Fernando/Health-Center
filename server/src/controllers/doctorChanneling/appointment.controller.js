const mongoose = require("mongoose");
const Appointment = require("../../models/doctorChanneling/appointment.model");
const Slot = require("../../models/doctorChanneling/slot.model");
const ApiError = require("../../utils/ApiError");

async function create(req, res, next) {
  try {
    const { centerId, doctorId, userId, slotId, note } = req.body;

    if (!centerId) throw new ApiError(400, "centerId is required");
    if (!doctorId) throw new ApiError(400, "doctorId is required");
    if (!userId) throw new ApiError(400, "userId is required");
    if (!slotId) throw new ApiError(400, "slotId is required");

    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      throw new ApiError(400, "Invalid centerId");
    }
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new ApiError(400, "Invalid doctorId");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid userId");
    }
    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      throw new ApiError(400, "Invalid slotId");
    }

    const slot = await Slot.findById(slotId);
    if (!slot) throw new ApiError(404, "Slot not found");

    if (!slot.isActive) {
      throw new ApiError(400, "Slot is inactive");
    }

    if (slot.isBooked) {
      throw new ApiError(409, "Slot already booked");
    }

    if (String(slot.doctorId) !== String(doctorId)) {
      throw new ApiError(400, "Slot does not belong to this doctor");
    }

    if (String(slot.centerId) !== String(centerId)) {
      throw new ApiError(400, "Slot does not belong to this center");
    }

    const existing = await Appointment.findOne({ slotId }).lean();
    if (existing) {
      throw new ApiError(409, "Appointment already exists for this slot");
    }

    const created = await Appointment.create({
      centerId,
      doctorId,
      userId,
      slotId,
      note: note || "",
      status: "pending",
      statusUpdatedAt: new Date(),
      statusUpdatedBy: "system",
      payment: {
        status: "unpaid",
        amount: 0,
        currency: "LKR",
      },
    });

    slot.isBooked = true;
    await slot.save();

    const populated = await Appointment.findById(created._id)
      .populate("userId", "fullName email phone")
      .populate("doctorId", "name specialization clinic fee phone")
      .populate("centerId", "name district")
      .populate("slotId", "date startTime endTime")
      .lean();

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (err) {
    next(err);
  }
}

async function listByDoctor(req, res, next) {
  try {
    const doctorId = req.doctor._id;
    const { status, q, page = 1, limit = 20 } = req.query;

    const filter = { doctorId };

    if (status) {
      filter.status = status;
    }

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (safePage - 1) * safeLimit;

    if (q && String(q).trim()) {
      const search = String(q).trim();

      const matchedUserIds = await Appointment.db
        .collection("users")
        .find(
          {
            $or: [
              { fullName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
              { phone: { $regex: search, $options: "i" } },
            ],
          },
          { projection: { _id: 1 } }
        )
        .toArray();

      const userIds = matchedUserIds.map((u) => u._id);

      if (userIds.length) {
        filter.$or = [{ userId: { $in: userIds } }];
      } else {
        filter.$or = [{ _id: null }];
      }
    }

    const [items, total] = await Promise.all([
      Appointment.find(filter)
        .populate("userId", "fullName email phone")
        .populate("doctorId", "name specialization clinic fee phone")
        .populate("centerId", "name district")
        .populate("slotId", "date startTime endTime")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid appointment id");
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (userId && String(appointment.userId) !== String(userId)) {
      throw new ApiError(403, "You can only cancel your own appointment");
    }

    if (appointment.status === "cancelled") {
      throw new ApiError(400, "Appointment already cancelled");
    }

    appointment.status = "cancelled";
    appointment.statusUpdatedAt = new Date();
    appointment.statusUpdatedBy = "patient";

    await appointment.save();

    if (appointment.slotId) {
      await Slot.findByIdAndUpdate(appointment.slotId, {
        $set: { isBooked: false },
      });
    }

    return res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
}

async function updateAppointmentStatusByDoctor(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid appointment id");
    }

    const allowedStatuses = ["completed", "no_show"];
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status");
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (req.doctor && String(appointment.doctorId) !== String(req.doctor._id)) {
      throw new ApiError(403, "You can only update your own appointments");
    }

    if (appointment.status === "cancelled") {
      throw new ApiError(400, "Cancelled appointment cannot be updated");
    }

    if (appointment.status === "completed" || appointment.status === "no_show") {
      return res.json({
        success: true,
        data: appointment,
      });
    }

    appointment.status = status;
    appointment.statusUpdatedAt = new Date();
    appointment.statusUpdatedBy = "doctor";

    await appointment.save();

    return res.json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  listByDoctor,
  cancel,
  updateAppointmentStatusByDoctor,
};