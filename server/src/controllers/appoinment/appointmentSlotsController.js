const HealthCenter = require("../../models/HealthCenter");
const AppointmentSlot = require("../../models/AppoinmentSlot");
require("../../models/User");
require("../../models/Appoinment");
const mongoose = require("mongoose");


function getSlotEndDateTime(slot) {
  const date = new Date(slot.slotDate);
  const [hours, minutes] = slot.endTime.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}


function isSlotExpired(slot) {
  return getSlotEndDateTime(slot) <= new Date();
}

async function generateAppointmentSlots(req, res) {
  try {
    let { healthCenterId, startDateStr, numberOfDays, slotMinutes } = req.body;

    console.log("generateAppointmentSlots called with", {
      healthCenterId,
      startDateStr,
      numberOfDays,
      slotMinutes,
    });

    if (!healthCenterId)
      return res.status(400).json({ error: "healthCenterId is required" });

    if (!startDateStr)
      return res
        .status(400)
        .json({ error: "startDate (YYYY-MM-DD) is required" });

    if (!mongoose.Types.ObjectId.isValid(healthCenterId)) {
      return res.status(400).json({ error: "Invalid healthCenterId" });
    }

    numberOfDays = parseInt(numberOfDays, 10) || 14;
    numberOfDays = Math.min(Math.max(numberOfDays, 1), 14);

    slotMinutes = parseInt(slotMinutes, 10) || 30;

    const [year, monthStr, dayStr] = startDateStr.split("-");
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(monthStr, 10) - 1;
    const dayNum = parseInt(dayStr, 10);

    if ([yearNum, monthNum, dayNum].some(Number.isNaN)) {
      return res.status(400).json({ error: "Invalid startDate format" });
    }

    // Store as UTC midnight so the calendar date is timezone-agnostic
    const startDate = new Date(Date.UTC(yearNum, monthNum, dayNum, 0, 0, 0, 0));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return res
        .status(400)
        .json({ error: "Cannot generate slots for past dates" });
    }

    const center = await HealthCenter.findById(healthCenterId).lean();

    if (!center)
      return res
        .status(404)
        .json({ error: `HealthCenter not found: ${healthCenterId}` });

    const { openingTime, closingTime, name: centerName } = center;

    if (!openingTime || !closingTime) {
      return res.status(400).json({
        error: "Health center must have openingTime and closingTime",
      });
    }

    const timeToMinutes = (hhmm) => {
      const [hh, mm] = hhmm.split(":").map(Number);
      return hh * 60 + mm;
    };

    const minutesToHHMM = (mins) => {
      const hh = Math.floor(mins / 60);
      const mm = mins % 60;
      const pad = (n) => (n < 10 ? `0${n}` : n);
      return `${pad(hh)}:${pad(mm)}`;
    };

    // Use UTC methods so the date string matches what was saved, regardless of server timezone
    const dateKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;

    const openingMin = timeToMinutes(openingTime);
    const closingMin = timeToMinutes(closingTime);

    if (closingMin <= openingMin) {
      return res
        .status(400)
        .json({ error: "closingTime must be after openingTime" });
    }

    const dates = [];
    for (let i = 0; i < numberOfDays; i++) {
      dates.push(new Date(Date.UTC(yearNum, monthNum, dayNum + i, 0, 0, 0, 0)));
    }

    const endDate = new Date(dates[dates.length - 1]);
    endDate.setUTCHours(23, 59, 59, 999);

    const existingSlots = await AppointmentSlot.find({
      center: healthCenterId,
      slotDate: { $gte: dates[0], $lte: endDate },
    }).lean();

    const existingSet = new Set(
      existingSlots.map(
        (s) => `${dateKey(new Date(s.slotDate))}|${s.startTime}`,
      ),
    );

    const slotsToInsert = [];
    let skippedSlots = 0;

    for (const currentDate of dates) {
      for (
        let startMin = openingMin;
        startMin + slotMinutes <= closingMin;
        startMin += slotMinutes
      ) {
        const startTimeStr = minutesToHHMM(startMin);
        const endTimeStr = minutesToHHMM(startMin + slotMinutes);

        const key = `${dateKey(currentDate)}|${startTimeStr}`;

        if (existingSet.has(key)) {
          skippedSlots++;
          continue;
        }

        slotsToInsert.push({
          center: healthCenterId,
          slotDate: currentDate,
          startTime: startTimeStr,
          endTime: endTimeStr,
          status: "AVAILABLE",
        });
      }
    }

    let createdSlots = [];

    if (slotsToInsert.length > 0) {
      createdSlots = await AppointmentSlot.insertMany(slotsToInsert);
    }

    let message = "";

    if (createdSlots.length > 0 && skippedSlots > 0) {
      message = `${createdSlots.length} new slots created. ${skippedSlots} slots were skipped because they already exist.`;
    } else if (createdSlots.length > 0) {
      message = `${createdSlots.length} slots successfully created for "${centerName}".`;
    } else {
      message = `No new slots created. All slots already exist for the selected dates.`;
    }

    return res.status(201).json({
      message,
      startDate: startDateStr,
      endDate: dateKey(dates[dates.length - 1]),
      createdCount: createdSlots.length,
      skippedCount: skippedSlots,
      createdSlots,
    });
  } catch (err) {
    console.error("generateAppointmentSlots error:", err);

    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
}

async function updateAppointmentSlots(req, res) {
  try {
    const { id } = req.params;

    const { status, bookedBy, appoinment } = req.body;

    const slot = await AppointmentSlot.findById(id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Appointment slot not found",
      });
    }

    if (status) slot.status = status;
    if (bookedBy !== undefined) slot.bookedBy = bookedBy;
    if (appoinment !== undefined) slot.appoinment = appoinment;

    const updatedSlot = await slot.save();

    res.status(200).json({
      success: true,
      message: "Appointment slot updated successfully",
      data: updatedSlot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAppointmentSlots(req, res) {
  try {
    const { status, center, startDate, endDate } = req.query;

    if (!center) {
      return res.status(400).json({
        success: false,
        message: "center ID is required",
      });
    }

    let filter = { center };

    if (status) {
      if (!["AVAILABLE", "BOOKED", "CANCELLED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.slotDate = {};
      if (startDate) filter.slotDate.$gte = new Date(startDate);
      if (endDate) filter.slotDate.$lte = new Date(endDate);
    }

    const slots = await AppointmentSlot.find(filter)
      .populate("center")
      .populate("bookedBy")
      .populate("appoinment")
      .sort({ slotDate: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

const getAvailableAppointmentSlots = async (req, res) => {
  try {
    const { centerId } = req.params;
    const now = new Date();

    const slots = await AppointmentSlot.find({
      center: centerId,
      status: "AVAILABLE",
    });

    const availableSlots = slots.filter((slot) => {
      const slotDateTime = new Date(slot.slotDate);
      const [hours, minutes] = slot.startTime.split(":").map(Number);
      slotDateTime.setHours(hours, minutes, 0, 0);

      return slotDateTime > now;
    });

    return res.status(200).json({
      center: centerId,
      availableSlots,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

async function getAppointmentSlotsByCenterId(req, res) {
  try {
    const { centerId } = req.params;
    const { status, startDate, endDate, type } = req.query;

    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid center ID",
      });
    }

    let filter = { center: centerId };

    if (status) {
      if (!["AVAILABLE", "BOOKED", "CANCELLED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value. Must be AVAILABLE, BOOKED, or CANCELLED",
        });
      }
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.slotDate = {};
      if (startDate) filter.slotDate.$gte = new Date(startDate);
      if (endDate) filter.slotDate.$lte = new Date(endDate);
    }

    // Pre-filter by date range for type-based queries (optimisation).
    // Exact time-boundary check is applied in-memory below.
    if (type === "upcoming") {
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      filter.slotDate = Object.assign(filter.slotDate || {}, { $gte: todayMidnight });
    } else if (type === "expired") {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      filter.slotDate = Object.assign(filter.slotDate || {}, { $lte: endOfToday });
    } else if (type) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be 'upcoming' or 'expired'",
      });
    }

    const slots = await AppointmentSlot.find(filter)
      .populate("center")
      .populate("bookedBy")
      .populate("appoinment")
      .sort({ slotDate: 1, startTime: 1 });

    // Apply exact time-aware in-memory filter when type is specified.
    let filteredSlots = slots;
    if (type === "upcoming") {
      filteredSlots = slots.filter((s) => !isSlotExpired(s));
    } else if (type === "expired") {
      filteredSlots = slots.filter((s) => isSlotExpired(s));
    }

    return res.status(200).json({
      success: true,
      count: filteredSlots.length,
      data: filteredSlots,
    });
  } catch (error) {
    console.error("getAppointmentSlotsByCenterId error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteAppointmentSlot(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot ID",
      });
    }

    const slot = await AppointmentSlot.findById(id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Appointment slot not found",
      });
    }

    if (slot.status === "BOOKED") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a booked appointment slot",
      });
    }

    const now = new Date();
    const slotDateTime = new Date(slot.slotDate);
    const [hours, minutes] = slot.startTime.split(":").map(Number);
    slotDateTime.setHours(hours, minutes, 0, 0);

    if (slotDateTime < now) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete past appointment slots",
      });
    }

    await AppointmentSlot.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Appointment slot deleted successfully",
    });
  } catch (error) {
    console.error("deleteAppointmentSlot error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


async function deleteExpiredUnbookedSlots(req, res) {
  try {
    const { centerId, date } = req.query;

    if (!centerId || !mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({
        success: false,
        message: "Valid centerId query param is required",
      });
    }

    // Only unbooked slots for this center.
    const filter = {
      center: centerId,
      appoinment: null,
      status: { $ne: "BOOKED" },
    };

    if (date) {
      // Restrict to the single given calendar date using UTC boundaries
      // to avoid timezone mismatches between local server time and stored UTC dates.
      // Expect `date` in YYYY-MM-DD.
      const parts = (date || '').split('-').map(Number);
      if (parts.length !== 3 || parts.some((v) => Number.isNaN(v))) {
        return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
      }
      const [y, m, d] = parts;
      const startUtc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
      const nextUtc = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0));
      filter.slotDate = { $gte: startUtc, $lt: nextUtc };
    } else {
      // Optimisation: future slots can never be expired. Use end-of-today in UTC.
      const now = new Date();
      const endOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      filter.slotDate = { $lte: endOfTodayUtc };
    }

    const candidates = await AppointmentSlot.find(filter).lean();

    // Exact time-boundary check in memory.
    const expired = candidates.filter((s) => isSlotExpired(s));
    const expiredIds = expired.map((s) => s._id);

    // Helpful debug info for callers: how many candidates were examined
    // and a small preview of candidate slots (id, slotDate, endTime).
    const candidatesPreview = candidates.slice(0, 10).map((s) => ({
      _id: s._id,
      slotDate: s.slotDate,
      endTime: s.endTime,
    }));

    if (expiredIds.length === 0) {
      console.debug('deleteExpiredUnbookedSlots: candidates=', candidates.length, 'expired=0');
      return res.status(200).json({
        success: true,
        message: "No expired unbooked slots found to delete",
        candidatesCount: candidates.length,
        candidatesPreview,
        deletedCount: 0,
      });
    }

    const result = await AppointmentSlot.deleteMany({ _id: { $in: expiredIds } });

    console.debug('deleteExpiredUnbookedSlots: candidates=', candidates.length, 'expired=', expiredIds.length, 'deleted=', result.deletedCount);

    return res.status(200).json({
      success: true,
      message: "Expired unbooked slots deleted successfully",
      candidatesCount: candidates.length,
      deletedCount: result.deletedCount,
      deletedIdsPreview: expiredIds.slice(0, 20),
    });
  } catch (error) {
    console.error("deleteExpiredUnbookedSlots error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


async function deleteUpcomingUnbookedSlots(req, res) {
  try {
    const { centerId, date } = req.query;

    if (!centerId || !mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({ success: false, message: 'Valid centerId query param is required' });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'date query param (YYYY-MM-DD) is required for upcoming bulk delete' });
    }

    const parts = (date || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some((v) => Number.isNaN(v))) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const [y, m, d] = parts;
    const startUtc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    const nextUtc = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0));

    // Load all slots for that center and date
    const candidates = await AppointmentSlot.find({
      center: centerId,
      slotDate: { $gte: startUtc, $lt: nextUtc },
    }).lean();

    const now = new Date();

    const deletableIds = [];
    const failed = [];

    for (const s of candidates) {
      // Booked or attached appointment -> cannot delete
      if (s.status === 'BOOKED' || s.appoinment) {
        failed.push({ _id: s._id, startTime: s.startTime, reason: 'BOOKED' });
        continue;
      }

      // If the slot is already expired (in the past) we treat it as non-upcoming and do not delete here.
      if (isSlotExpired(s)) {
        failed.push({ _id: s._id, startTime: s.startTime, reason: 'PAST' });
        continue;
      }

      deletableIds.push(s._id);
    }

    let deletedCount = 0;
    if (deletableIds.length > 0) {
      const result = await AppointmentSlot.deleteMany({ _id: { $in: deletableIds } });
      deletedCount = result.deletedCount || 0;
    }

    return res.status(200).json({
      success: true,
      message: 'Bulk upcoming unbooked delete completed',
      candidatesCount: candidates.length,
      deletedCount,
      failed,
    });
  } catch (error) {
    console.error('deleteUpcomingUnbookedSlots error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  generateAppointmentSlots,
  updateAppointmentSlots,
  getAppointmentSlots,
  getAppointmentSlotsByCenterId,
  getAvailableAppointmentSlots,
  deleteAppointmentSlot,
  deleteExpiredUnbookedSlots,
  deleteUpcomingUnbookedSlots,
  getSlotEndDateTime,
  isSlotExpired,
};
