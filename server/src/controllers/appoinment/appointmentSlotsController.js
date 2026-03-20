const HealthCenter = require("../../models/HealthCenter");
const AppointmentSlot = require("../../models/AppoinmentSlot");
require("../../models/User");
require("../../models/Appoinment");
const mongoose = require("mongoose");

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

    const startDate = new Date(yearNum, monthNum, dayNum, 0, 0, 0, 0);

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

    const dateKey = (date) => date.toLocaleDateString("en-CA"); // YYYY-MM-DD

    const openingMin = timeToMinutes(openingTime);
    const closingMin = timeToMinutes(closingTime);

    if (closingMin <= openingMin) {
      return res
        .status(400)
        .json({ error: "closingTime must be after openingTime" });
    }

    const dates = [];
    for (let i = 0; i < numberOfDays; i++) {
      dates.push(new Date(yearNum, monthNum, dayNum + i, 0, 0, 0, 0));
    }

    const endDate = new Date(dates[dates.length - 1]);
    endDate.setHours(23, 59, 59, 999);

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

module.exports = {
  generateAppointmentSlots,
  updateAppointmentSlots,
  getAppointmentSlots,
  getAvailableAppointmentSlots,
  deleteAppointmentSlot,
};
