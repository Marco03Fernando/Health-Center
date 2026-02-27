const mongoose = require("mongoose");
const Doctor = require("../../models/doctorChanneling/doctor.model");
const Slot = require("../../models/doctorChanneling/slot.model");

function assertObjectId(id, name = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${name}`);
    error.status = 400;
    throw error;
  }
}

/**
 * Helpers for slot generation
 */
function toMin(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    const err = new Error("Invalid time format. Use HH:mm (example: 09:00)");
    err.status = 400;
    throw err;
  }
  return h * 60 + m;
}

function toHHMM(min) {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function buildSlots({ startTime, endTime, durationMin }) {
  const start = toMin(startTime);
  const end = toMin(endTime);

  if (!Number.isInteger(durationMin) || durationMin <= 0) {
    const err = new Error("sessionTime/durationMin must be a positive integer (example: 15)");
    err.status = 400;
    throw err;
  }
  if (end <= start) {
    const err = new Error("endTime must be after startTime");
    err.status = 400;
    throw err;
  }

  const slots = [];
  for (let t = start; t + durationMin <= end; t += durationMin) {
    slots.push({
      startTime: toHHMM(t),
      endTime: toHHMM(t + durationMin),
    });
  }
  return slots;
}

// Controller Method for Creating a Doctor (+ optional slot auto-generation)
async function create(req, res) {
  try {
    const {
      name,
      centerId,
      specialization,
      clinic,
      fee,
      phone,
      isActive,

      // ✅ NEW Doctor fields
      startTime,     // "09:00"
      endTime,       // "11:00"
      sessionTime,   // 15

      // OPTIONAL slot-generation inputs
      date,          // "YYYY-MM-DD"
      dates,         // ["YYYY-MM-DD", ...]
      generateSlots, // true/false (optional)
      regenerate,    // true/false (optional)
      durationMin,   // also supported
    } = req.body;

    // Create the doctor (now saves schedule fields too)
    const doctor = await Doctor.create({
      name,
      centerId,
      specialization,
      clinic,
      fee,
      phone,
      startTime,
      endTime,
      sessionTime,
      isActive: isActive ?? true,
    });

    /**
     * AUTO GENERATE SLOTS (only if request includes required scheduling fields)
     * Required: date(or dates[]) + startTime + endTime + sessionTime/durationMin
     */
    const shouldGenerate =
      (generateSlots ?? true) &&
      (Array.isArray(dates) ? dates.length > 0 : !!date) &&
      !!startTime &&
      !!endTime &&
      ((sessionTime !== undefined && sessionTime !== null) ||
        (durationMin !== undefined && durationMin !== null));

    if (!shouldGenerate) {
      return res.status(201).json({ doctor });
    }

    const dateList = Array.isArray(dates) && dates.length ? dates : [date];
    const slotLen = Number.isInteger(Number(sessionTime))
      ? parseInt(sessionTime, 10)
      : parseInt(durationMin, 10);

    const pieces = buildSlots({ startTime, endTime, durationMin: slotLen });

    // OPTIONAL: regenerate slots only in that window (DO NOT delete booked)
    if (regenerate) {
      await Slot.deleteMany({
        centerId,
        doctorId: doctor._id,
        date: { $in: dateList },
        isBooked: false,
        startTime: { $gte: startTime, $lt: endTime },
      });
    }

    const slotDocs = [];
    for (const d of dateList) {
      for (const p of pieces) {
        slotDocs.push({
          centerId,
          doctorId: doctor._id,
          date: d,
          startTime: p.startTime,
          endTime: p.endTime,
          isBooked: false,
          isActive: true,
        });
      }
    }

    // Insert slots, ignore duplicates safely
    let inserted = 0;
    try {
      const result = await Slot.insertMany(slotDocs, { ordered: false });
      inserted = result.length;
    } catch (err) {
      if (err && err.writeErrors) {
        inserted = err.result?.result?.nInserted ?? 0;
      } else {
        throw err;
      }
    }

    return res.status(201).json({
      doctor,
      slots: {
        requested: slotDocs.length,
        inserted,
        sessionTime: slotLen,
        dates: dateList,
        startTime,
        endTime,
      },
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// Controller Method for Getting a Doctor by ID
async function getById(req, res) {
  try {
    const { id } = req.params;
    assertObjectId(id, "doctor id");

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
    const {
      name,
      centerId,
      specialization,
      clinic,
      isActive,

      // ✅ allow updating schedule fields too
      startTime,
      endTime,
      sessionTime,
    } = req.body;

    assertObjectId(id, "doctor id");

    const patch = {
      name,
      centerId,
      specialization,
      clinic,
      isActive,
      startTime,
      endTime,
      sessionTime,
    };

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

    return res.json({ doctor: updated });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// Controller Method for Setting Doctor's Active Status
async function setActive(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
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

    return res.json({ doctor: updated });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = { create, getById, list, update, setActive };