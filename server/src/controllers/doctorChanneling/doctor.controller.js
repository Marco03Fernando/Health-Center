const mongoose = require("mongoose");
const Doctor = require("../../models/doctorChanneling/doctor.model");
const Slot = require("../../models/doctorChanneling/slot.model");
const User = require("../../models/doctorChanneling/user.model");

const DEFAULT_SLOT_WINDOW_DAYS = 14;
const VALID_WORKING_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

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
  const parts = String(hhmm).split(":");

  if (parts.length < 2) {
    const err = new Error("Invalid time format. Use HH:mm");
    err.status = 400;
    throw err;
  }

  const h = Number(parts[0]);
  const m = Number(parts[1]);

  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    const err = new Error("Invalid time format. Use HH:mm");
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
  const step = Number(durationMin);

  if (!Number.isInteger(step) || step <= 0) {
    const err = new Error("sessionTime must be a positive integer");
    err.status = 400;
    throw err;
  }

  if (end <= start) {
    const err = new Error("endTime must be after startTime");
    err.status = 400;
    throw err;
  }

  const slots = [];
  let current = start;

  while (current + step <= end) {
    slots.push({
      startTime: toHHMM(current),
      endTime: toHHMM(current + step),
    });
    current += step;
  }

  return slots;
}

function pickDefined(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value).trim());
}

function getTodayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysToDateString(baseDateString, daysToAdd) {
  const d = new Date(`${baseDateString}T00:00:00`);
  d.setDate(d.getDate() + Number(daysToAdd || 0));

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getRollingDates(days = DEFAULT_SLOT_WINDOW_DAYS, fromDate = getTodayDateString()) {
  const totalDays = Number(days);

  if (!Number.isInteger(totalDays) || totalDays <= 0) {
    return [];
  }

  const result = [];
  for (let i = 0; i < totalDays; i += 1) {
    result.push(addDaysToDateString(fromDate, i));
  }

  return result;
}

function normalizeDates(date, dates, fallbackWindowDays = DEFAULT_SLOT_WINDOW_DAYS) {
  if (Array.isArray(dates) && dates.length > 0) {
    return [
      ...new Set(
        dates.map((d) => String(d).trim()).filter((d) => d && isValidDateString(d))
      ),
    ];
  }

  if (date) {
    const one = String(date).trim();
    return isValidDateString(one) ? [one] : [];
  }

  return getRollingDates(fallbackWindowDays);
}

function normalizeWorkingDays(workingDays) {
  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    return ["mon", "tue", "wed", "thu", "fri"];
  }

  const cleaned = [
    ...new Set(
      workingDays
        .map((d) => String(d).trim().toLowerCase())
        .filter((d) => VALID_WORKING_DAYS.includes(d))
    ),
  ];

  return cleaned.length ? cleaned : ["mon", "tue", "wed", "thu", "fri"];
}

function normalizeHolidayDates(holidayDates) {
  if (!Array.isArray(holidayDates) || holidayDates.length === 0) {
    return [];
  }

  return [
    ...new Set(
      holidayDates
        .map((d) => String(d).trim())
        .filter((d) => d && isValidDateString(d))
    ),
  ];
}

function getDayKeyFromDateString(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay(); // 0=sun ... 6=sat
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[day];
}

function filterDatesBySchedule(dates, workingDays = [], holidayDates = []) {
  const workingDaySet = new Set(normalizeWorkingDays(workingDays));
  const holidaySet = new Set(normalizeHolidayDates(holidayDates));

  return dates.filter((date) => {
    if (!isValidDateString(date)) return false;
    if (holidaySet.has(date)) return false;

    const dayKey = getDayKeyFromDateString(date);
    return workingDaySet.has(dayKey);
  });
}

async function insertSlotDocs(slotDocs) {
  let inserted = 0;

  try {
    const result = await Slot.insertMany(slotDocs, { ordered: false });
    inserted = Array.isArray(result) ? result.length : 0;
  } catch (err) {
    if (err && err.writeErrors) {
      inserted =
        Array.isArray(err.insertedDocs)
          ? err.insertedDocs.length
          : err.result?.nInserted || err.result?.result?.nInserted || 0;
    } else {
      throw err;
    }
  }

  return inserted;
}

async function createSlotsForDoctor({
  doctor,
  centerId,
  startTime,
  endTime,
  sessionTime,
  dates,
  workingDays,
  holidayDates,
  regenerate = false,
}) {
  const trimmedStart = startTime ? String(startTime).trim() : "";
  const trimmedEnd = endTime ? String(endTime).trim() : "";
  const slotLen =
    sessionTime !== undefined && sessionTime !== null && sessionTime !== ""
      ? Number(sessionTime)
      : null;

  if (
    !doctor ||
    !centerId ||
    !trimmedStart ||
    !trimmedEnd ||
    !slotLen ||
    !Number.isInteger(slotLen) ||
    slotLen <= 0 ||
    !Array.isArray(dates) ||
    dates.length === 0
  ) {
    return {
      created: false,
      requested: 0,
      inserted: 0,
      dates: Array.isArray(dates) ? dates : [],
      actualDates: [],
      generatedSlotsPerDay: [],
      reason: "Missing or invalid slot generation inputs",
    };
  }

  const filteredDates = filterDatesBySchedule(
    dates,
    workingDays || doctor.workingDays || [],
    holidayDates || doctor.holidayDates || []
  );

  const pieces = buildSlots({
    startTime: trimmedStart,
    endTime: trimmedEnd,
    durationMin: slotLen,
  });

  if (!pieces.length) {
    return {
      created: false,
      requested: 0,
      inserted: 0,
      dates,
      actualDates: filteredDates,
      generatedSlotsPerDay: [],
      reason: "No valid slot range generated",
    };
  }

  if (!filteredDates.length) {
    return {
      created: true,
      requested: 0,
      inserted: 0,
      dates,
      actualDates: [],
      generatedSlotsPerDay: pieces,
      reason: "No matching working days after excluding holidays",
    };
  }

  if (regenerate) {
    await Slot.deleteMany({
      centerId,
      doctorId: doctor._id,
      date: { $in: filteredDates },
      isBooked: false,
    });
  }

  const slotDocs = [];
  for (const d of filteredDates) {
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

  const inserted = await insertSlotDocs(slotDocs);

  return {
    created: true,
    requested: slotDocs.length,
    inserted,
    dates,
    actualDates: filteredDates,
    startTime: trimmedStart,
    endTime: trimmedEnd,
    sessionTime: slotLen,
    workingDays: normalizeWorkingDays(workingDays || doctor.workingDays || []),
    holidayDates: normalizeHolidayDates(holidayDates || doctor.holidayDates || []),
    generatedSlotsPerDay: pieces,
  };
}

async function deactivatePastUnbookedSlotsForDoctor(doctorId, today = getTodayDateString()) {
  return Slot.updateMany(
    {
      doctorId,
      date: { $lt: today },
      isBooked: false,
      isActive: true,
    },
    {
      $set: { isActive: false },
    }
  );
}

async function deactivatePastUnbookedSlotsForAll(today = getTodayDateString()) {
  return Slot.updateMany(
    {
      date: { $lt: today },
      isBooked: false,
      isActive: true,
    },
    {
      $set: { isActive: false },
    }
  );
}

// Create doctor + doctor login account + rolling slot generation
async function create(req, res) {
  try {
    const {
      // user account
      fullName,
      email,
      password,
      phone,

      // doctor profile
      name,
      centerId,
      specialization,
      clinic,
      fee,
      isActive,
      workingDays,
      holidayDates,

      // schedule
      startTime,
      endTime,
      sessionTime,

      // slot generation
      date,
      dates,
      generateSlots,
      regenerate,
      durationMin,
      slotWindowDays,
    } = req.body;

    const doctorName = (name || fullName || "").trim();
    const userFullName = (fullName || name || "").trim();

    if (
      !doctorName ||
      !userFullName ||
      !email ||
      !password ||
      !phone ||
      !centerId ||
      !specialization ||
      !clinic ||
      fee === undefined ||
      fee === null
    ) {
      return res.status(400).json({
        message:
          "name/fullName, email, password, phone, centerId, specialization, clinic and fee are required",
      });
    }

    assertObjectId(centerId, "centerId");

    const normalizedWorkingDays = normalizeWorkingDays(workingDays);
    const normalizedHolidayDates = normalizeHolidayDates(holidayDates);

    const existingUser = await User.findOne({ email: String(email).trim() }).lean();
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    const user = await User.create({
      fullName: userFullName,
      phone: String(phone).trim(),
      email: String(email).trim(),
      password,
      role: "doctor",
      mustChangePassword: true,
      isActive: isActive ?? true,
    });

    const doctor = await Doctor.create({
      userId: user._id,
      name: doctorName,
      centerId,
      specialization: String(specialization).trim(),
      clinic: String(clinic).trim(),
      fee: Number(fee),
      phone: String(phone).trim(),
      startTime: startTime ? String(startTime).trim() : undefined,
      endTime: endTime ? String(endTime).trim() : undefined,
      sessionTime:
        sessionTime !== undefined && sessionTime !== null && sessionTime !== ""
          ? Number(sessionTime)
          : undefined,
      workingDays: normalizedWorkingDays,
      holidayDates: normalizedHolidayDates,
      isActive: isActive ?? true,
    });

    const wantsSlots = generateSlots !== false;
    const slotLen =
      sessionTime !== undefined && sessionTime !== null && sessionTime !== ""
        ? Number(sessionTime)
        : durationMin !== undefined && durationMin !== null && durationMin !== ""
        ? Number(durationMin)
        : null;

    if (!wantsSlots) {
      return res.status(201).json({
        message: "Doctor account and profile created successfully",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          isActive: user.isActive,
        },
        doctor,
        slots: {
          created: false,
          reason: "Slot generation disabled",
        },
      });
    }

    const normalizedDates = normalizeDates(
      date,
      dates,
      Number(slotWindowDays) > 0 ? Number(slotWindowDays) : DEFAULT_SLOT_WINDOW_DAYS
    );

    const slotResult = await createSlotsForDoctor({
      doctor,
      centerId,
      startTime,
      endTime,
      sessionTime: slotLen,
      dates: normalizedDates,
      workingDays: normalizedWorkingDays,
      holidayDates: normalizedHolidayDates,
      regenerate: !!regenerate,
    });

    return res.status(201).json({
      message: "Doctor account, profile, and slots created successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        isActive: user.isActive,
      },
      doctor,
      slots: slotResult,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// Get doctor by ID
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

// List doctors
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
      Doctor.find(filter)
        .populate("centerId", "name location")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
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

// Update doctor by admin
async function update(req, res) {
  try {
    const { id } = req.params;

    assertObjectId(id, "doctor id");

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
      workingDays,
      holidayDates,
      generateSlots,
      regenerate,
      date,
      dates,
      durationMin,
      slotWindowDays,
    } = req.body;

    if (centerId !== undefined) {
      assertObjectId(centerId, "centerId");
    }

    const patch = pickDefined({
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
      workingDays: workingDays !== undefined ? normalizeWorkingDays(workingDays) : undefined,
      holidayDates: holidayDates !== undefined ? normalizeHolidayDates(holidayDates) : undefined,
    });

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

    if (phone !== undefined || isActive !== undefined) {
      await User.findByIdAndUpdate(
        updated.userId,
        {
          $set: pickDefined({
            phone,
            isActive,
          }),
        },
        { new: true, runValidators: true }
      );
    }

    let slotResult = null;

    if (generateSlots === true) {
      const normalizedDates = normalizeDates(
        date,
        dates,
        Number(slotWindowDays) > 0 ? Number(slotWindowDays) : DEFAULT_SLOT_WINDOW_DAYS
      );

      const slotLen =
        sessionTime !== undefined && sessionTime !== null && sessionTime !== ""
          ? Number(sessionTime)
          : updated.sessionTime !== undefined && updated.sessionTime !== null
          ? Number(updated.sessionTime)
          : durationMin !== undefined && durationMin !== null && durationMin !== ""
          ? Number(durationMin)
          : null;

      slotResult = await createSlotsForDoctor({
        doctor: updated,
        centerId: updated.centerId,
        startTime: startTime ?? updated.startTime,
        endTime: endTime ?? updated.endTime,
        sessionTime: slotLen,
        dates: normalizedDates,
        workingDays: updated.workingDays,
        holidayDates: updated.holidayDates,
        regenerate: !!regenerate,
      });
    }

    return res.json({
      message: "Doctor updated successfully",
      doctor: updated,
      ...(slotResult ? { slots: slotResult } : {}),
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// Set active/inactive
async function setActive(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    assertObjectId(id, "doctor id");

    const updated = await Doctor.findByIdAndUpdate(
      id,
      { $set: { isActive: !!isActive } },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      const err = new Error("Doctor not found");
      err.status = 404;
      throw err;
    }

    if (updated.userId) {
      await User.findByIdAndUpdate(updated.userId, { $set: { isActive: !!isActive } });
    }

    return res.json({
      message: "Doctor active status updated successfully",
      doctor: updated,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// Doctor self profile update
async function updateProfile(req, res) {
  try {
    const userId = req.userId;

    const {
      fullName,
      email,
      name,
      specialization,
      clinic,
      fee,
      phone,
      startTime,
      endTime,
      sessionTime,
      workingDays,
      holidayDates,
    } = req.body;

    const updatedDoctor = await Doctor.findOneAndUpdate(
      { userId },
      {
        $set: pickDefined({
          name,
          specialization,
          clinic,
          fee,
          phone,
          startTime,
          endTime,
          sessionTime,
          workingDays: workingDays !== undefined ? normalizeWorkingDays(workingDays) : undefined,
          holidayDates: holidayDates !== undefined ? normalizeHolidayDates(holidayDates) : undefined,
        }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: pickDefined({
          fullName,
          email,
          phone,
        }),
      },
      { new: true, runValidators: true }
    ).select("fullName email phone role mustChangePassword");

    res.json({
      message: "Doctor profile updated successfully",
      doctor: {
        id: updatedDoctor._id,
        userId: updatedDoctor.userId,
        fullName: updatedUser?.fullName || "",
        email: updatedUser?.email || "",
        phone: updatedUser?.phone || updatedDoctor.phone || "",
        role: updatedUser?.role || "doctor",
        mustChangePassword: updatedUser?.mustChangePassword || false,
        name: updatedDoctor.name,
        specialization: updatedDoctor.specialization,
        clinic: updatedDoctor.clinic,
        fee: updatedDoctor.fee,
        startTime: updatedDoctor.startTime,
        endTime: updatedDoctor.endTime,
        sessionTime: updatedDoctor.sessionTime,
        workingDays: updatedDoctor.workingDays || [],
        holidayDates: updatedDoctor.holidayDates || [],
        isActive: updatedDoctor.isActive,
      },
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: err.message });
  }
}

async function getMe(req, res) {
  try {
    const userId = req.userId;

    const [doctor, user] = await Promise.all([
      Doctor.findOne({ userId }).lean(),
      User.findById(userId).select("fullName email phone role mustChangePassword").lean(),
    ]);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    return res.json({
      doctor: {
        id: doctor._id,
        userId: doctor.userId,
        fullName: user?.fullName || "",
        email: user?.email || "",
        phone: user?.phone || doctor.phone || "",
        role: user?.role || "doctor",
        mustChangePassword: user?.mustChangePassword || false,
        name: doctor.name,
        specialization: doctor.specialization,
        clinic: doctor.clinic,
        fee: doctor.fee,
        startTime: doctor.startTime,
        endTime: doctor.endTime,
        sessionTime: doctor.sessionTime,
        workingDays: doctor.workingDays || [],
        holidayDates: doctor.holidayDates || [],
        isActive: doctor.isActive,
        centerId: doctor.centerId || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

/**
 * Manual endpoint: generate upcoming slots
 * Can be called later from cron job too
 */
async function generateUpcomingSlots(req, res) {
  try {
    const {
      doctorId,
      days = DEFAULT_SLOT_WINDOW_DAYS,
      regenerate = false,
    } = req.body || {};

    const filter = { isActive: true };
    if (doctorId) {
      assertObjectId(doctorId, "doctorId");
      filter._id = doctorId;
    }

    const doctors = await Doctor.find(filter).lean();

    let doctorsProcessed = 0;
    let totalRequested = 0;
    let totalInserted = 0;
    const details = [];

    for (const doctor of doctors) {
      if (!doctor.centerId || !doctor.startTime || !doctor.endTime || !doctor.sessionTime) {
        details.push({
          doctorId: doctor._id,
          name: doctor.name,
          created: false,
          reason: "Doctor schedule is incomplete",
        });
        continue;
      }

      const rollingDates = getRollingDates(Number(days) || DEFAULT_SLOT_WINDOW_DAYS);

      const result = await createSlotsForDoctor({
        doctor,
        centerId: doctor.centerId,
        startTime: doctor.startTime,
        endTime: doctor.endTime,
        sessionTime: doctor.sessionTime,
        dates: rollingDates,
        workingDays: doctor.workingDays,
        holidayDates: doctor.holidayDates,
        regenerate: !!regenerate,
      });

      await deactivatePastUnbookedSlotsForDoctor(doctor._id);

      doctorsProcessed += 1;
      totalRequested += result.requested || 0;
      totalInserted += result.inserted || 0;

      details.push({
        doctorId: doctor._id,
        name: doctor.name,
        ...result,
      });
    }

    return res.json({
      message: "Upcoming slot generation completed successfully",
      doctorsProcessed,
      totalRequested,
      totalInserted,
      details,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * Manual endpoint: deactivate expired unbooked slots
 */
async function cleanupExpiredSlots(req, res) {
  try {
    const result = await deactivatePastUnbookedSlotsForAll();

    return res.json({
      message: "Expired unbooked slots deactivated successfully",
      matchedCount: result.matchedCount ?? result.n ?? 0,
      modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = {
  create,
  getById,
  list,
  update,
  setActive,
  updateProfile,
  getMe,
  generateUpcomingSlots,
  cleanupExpiredSlots,
};