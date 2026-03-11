const mongoose = require("mongoose");
const Doctor = require("../../models/doctorChanneling/doctor.model");
const Slot = require("../../models/doctorChanneling/slot.model");
const User = require("../../models/doctorChanneling/user.model");


// Function to validate ObjectId
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
      // User account fields
      fullName,
      email,
      password,
      phone,

      // Doctor profile fields
      name,
      centerId,
      specialization,
      clinic,
      fee,
      isActive,

      // Schedule fields
      startTime,
      endTime,
      sessionTime,

      // Slot generation
      date,
      dates,
      generateSlots,
      regenerate,
      durationMin,
    } = req.body;

    // Basic validations
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        message: "fullName, email, phone and password are required for doctor account creation",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    // 1. Create login account for doctor
    const user = await User.create({
      fullName,
      phone,
      email,
      password,
      role: "doctor",
      mustChangePassword: true,
      isActive: isActive ?? true,
    });

    // 2. Create doctor profile linked to user
    const doctor = await Doctor.create({
      userId: user._id,
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
     * AUTO GENERATE SLOTS
     */
    const shouldGenerate =
      (generateSlots ?? true) &&
      (Array.isArray(dates) ? dates.length > 0 : !!date) &&
      !!startTime &&
      !!endTime &&
      ((sessionTime !== undefined && sessionTime !== null) ||
        (durationMin !== undefined && durationMin !== null));

    if (!shouldGenerate) {
      return res.status(201).json({
        message: "Doctor account and profile created successfully",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
        doctor,
      });
    }

    const dateList = Array.isArray(dates) && dates.length ? dates : [date];
    const slotLen = Number.isInteger(Number(sessionTime))
      ? parseInt(sessionTime, 10)
      : parseInt(durationMin, 10);

    const pieces = buildSlots({ startTime, endTime, durationMin: slotLen });

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
      message: "Doctor account, profile, and slots created successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
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
      fee,
      phone,
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
      fee,
      phone,
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

// Controller method for updating the doctor's own profile
// Define the function first
async function updateProfile(req, res) {
  try {
    const userId = req.user.id; // Get the logged-in doctor's ID from the token (set by 'protect' middleware)

    // Log the userId to verify if it is correctly populated
    console.log("Logged-in doctor userId:", userId);

    const { name, specialization, clinic, fee, phone, startTime, endTime, sessionTime } = req.body;

    // Use `userId` to find the doctor, since `userId` links the doctor to the logged-in user
    const updatedDoctor = await Doctor.findOneAndUpdate(
      { userId: userId },  // Match the logged-in user's ID in the Doctor collection
      { name, specialization, clinic, fee, phone, startTime, endTime, sessionTime },
      { new: true, runValidators: true }  // Ensures the updated doctor is returned
    );

    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({
      message: "Doctor profile updated successfully",
      doctor: updatedDoctor,
    });
  } catch (err) {
    console.error("Error updating profile:", err); // Log the error for debugging
    res.status(500).json({ message: err.message });
  }
}

async function getMe(req, res) {
  try {
    // Get the logged-in user's ID from the token, which is set by 'protect' middleware
    const userId = req.user._id;

    // Fetch the doctor's profile using the userId
    const doctor = await Doctor.findOne({ userId }).select("-password"); // Exclude password field for security

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    // Return the doctor's profile information
    return res.json({
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        clinic: doctor.clinic,
        fee: doctor.fee,
        phone: doctor.phone,
        startTime: doctor.startTime,
        endTime: doctor.endTime,
        sessionTime: doctor.sessionTime,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { create, getById, list, update, setActive, updateProfile, getMe };