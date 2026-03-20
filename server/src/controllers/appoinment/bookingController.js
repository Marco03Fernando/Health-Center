const mongoose = require('mongoose');
const AppointmentSlot = require('../../models/AppoinmentSlot');
const Booking = require('../../models/Appoinment');
const User = require('../../models/User');
const HealthCenter = require('../../models/HealthCenter');
require('../../models/DiagnosticTest');

const { sendBookingConfirmationEmail } = require("../../utils/emailService");

async function bookAppointment(req, res) {
  const { slotId, userId, diagnosticTestId } = req.body || {};

  if (!slotId || !userId) {
    return res.status(400).json({ error: "slotId and userId are required" });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const slot = await AppointmentSlot.findById(slotId).session(session);


    if (!slot) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Appointment slot not found" });
    }

    if (slot.status !== "AVAILABLE") {
      await session.abortTransaction();
      return res.status(400).json({ error: "Slot is not available" });
    }

    const now = new Date();

    const slotDateTime = new Date(slot.slotDate);
    const [h, m] = slot.startTime.split(":").map(Number);

    slotDateTime.setHours(h, m, 0, 0);

    const cutoffTime = new Date(slotDateTime.getTime() - 15 * 60 * 1000);

    if (now >= cutoffTime) {
      return res.status(400).json({
        message:
          "Booking for this slot has closed. Please choose another slot.",
      });
    }

    
    const booking = new Booking({
      user: userId,
      slot: slot._id,
      diagnosticTest: diagnosticTestId || null,
      healthCenter: slot.center,
      appointmentDate: slot.slotDate,
      appointmentStatus: "CONFIRMED",
    });

    const savedBooking = await booking.save({ session });

    slot.status = "BOOKED";
    slot.appoinment = savedBooking._id;
    slot.bookedBy = userId;

    await slot.save({ session });

    await session.commitTransaction();
    session.endSession();

    const user = await User.findById(userId);
    const center = await HealthCenter.findById(slot.center);

    if (user && user.email) {
      sendBookingConfirmationEmail(user.email, {
        bookingId: savedBooking._id,
        appointmentDate: slot.slotDate,
        center: center.name,
        status: "CONFIRMED",
      }).catch((err) => console.error("Email send failed:", err));
    }

    return res.status(201).json({
      message: "Booking confirmed",
      booking: savedBooking,
    });
  } catch (err) {
    console.error("createAppointment error:", err);

    try {
      await session.abortTransaction();
    } catch (e) {
      console.error("abortTransaction failed", e);
    }

    session.endSession();

    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
}

async function updateAppointment(req, res) {
  const { bookingId } = req.params; 
  const { status, diagnosticTestId } = req.body;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();


    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Booking not found' });
    }


    if (diagnosticTestId) {
      booking.diagnosticTest = diagnosticTestId;
    }

    if (status) {
      const oldStatus = booking.appointmentStatus;
      booking.appointmentStatus = status;

      if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
        await AppointmentSlot.findByIdAndUpdate(
          booking.slot,
          { 
            status: 'AVAILABLE', 
            appoinment: null, 
            bookedBy: null 
          },
          { session }
        );
      }
    }

    await booking.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ 
      success: true, 
      message: 'Appointment updated successfully', 
      data: booking 
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: 'Update failed', details: err.message });
  }
}

async function deleteAppointment(req, res) {
  const { bookingId } = req.params;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const booking = await Booking.findById(bookingId).session(session);
    
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    await AppointmentSlot.findByIdAndUpdate(
      booking.slot,
      { 
        status: 'AVAILABLE', 
        appoinment: null,
        bookedBy: null 
      },
      { session }
    );

    await Booking.findByIdAndDelete(bookingId).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully and slot is now available."
    });

  } catch (error) {
    if (session.inAtomicalTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getCenterAppointments(req, res) {
  try {
    const { centerId } = req.params;
    const { date, status, diagnosticTestId } = req.query;

    let filter = { healthCenter: centerId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (status) {
      filter.appointmentStatus = status;
    }

    if (diagnosticTestId) {
      filter.diagnosticTest = diagnosticTestId;
    }

    const appointments = await Booking.find(filter)
      .populate('user', 'name email phone') 
      .populate('diagnosticTest', 'name price') 
      .populate('slot', 'startTime endTime slotDate') 
      .sort({ 'slot.startTime': 1 }); 

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching center appointments",
      details: error.message
    });
  }
}

async function getAllAppointmentsAdmin(req, res) {
  try {
    const { status, date, centerId, testId } = req.query;
    let filter = {};

    if (status) filter.appointmentStatus = status;

    if (date) {
      const start = new Date(date);
      start.setHours(0,0,0,0);
      const end = new Date(date);
      end.setHours(23,59,59,999);
      filter.appointmentDate = { $gte: start, $lte: end };
    }

    if (centerId) filter.healthCenter = centerId;
    if (testId) filter.diagnosticTest = testId;

    const bookings = await Booking.find(filter)
      .populate('user', 'name phone')
      .populate('healthCenter', 'name location')
      .populate('diagnosticTest', 'testName price')
      .populate('slot', 'startTime endTime')
      .sort({ appointmentDate: -1 }); 

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  bookAppointment,
  updateAppointment,
  deleteAppointment ,
  getCenterAppointments ,
  getAllAppointmentsAdmin , 
};