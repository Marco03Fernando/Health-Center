const mongoose = require('mongoose');
const AppointmentSlot = require('../../models/AppoinmentSlot');
const Booking = require('../../models/Appoinment');
const User = require('../../models/User');
const HealthCenter = require('../../models/HealthCenter');
require('../../models/DiagnosticTest');

const { sendBookingConfirmationEmail, sendBookingCancellationEmail, sendBookingCompletedEmail } = require("../../utils/emailService");

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

      // capture old status to determine if we need to send cancel email after update
      let oldStatus = booking.appointmentStatus;

      if (diagnosticTestId) {
        booking.diagnosticTest = diagnosticTestId;
      }

      if (status) {
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

    // send emails if status changed
    try {
      const user = await User.findById(booking.user);
      const center = await HealthCenter.findById(booking.healthCenter);

      if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
        if (user && user.email) {
          sendBookingCancellationEmail(user.email, {
            bookingId: booking._id,
            appointmentDate: booking.appointmentDate,
            center: center ? center.name : '',
            status: 'CANCELLED',
          }).catch((err) => console.error('Cancellation email failed:', err));
        }
      }

      if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
        if (user && user.email) {
          sendBookingCompletedEmail(user.email, {
            bookingId: booking._id,
            appointmentDate: booking.appointmentDate,
            center: center ? center.name : '',
            status: 'COMPLETED',
          }).catch((err) => console.error('Completion email failed:', err));
        }
      }
    } catch (e) {
      console.error('Error while sending status-change emails:', e);
    }

    return res.status(200).json({ 
      success: true, 
      message: `Appointment ${status.toLowerCase()} successfully`, 
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

async function getAppointmentById(req, res) {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate('healthCenter', 'name address phone')
      .populate('diagnosticTest', 'name description instructions')
      .populate('slot', 'slotDate startTime endTime status');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching appointment by ID:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

async function getUserAppointments(req, res) {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Build filter query
    const filter = { user: userId };

    // Add status filter if provided
    if (status) {
      const validStatuses = ['CONFIRMED', 'CANCELLED', 'COMPLETED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
      filter.appointmentStatus = status.toUpperCase();
    }

    const appointments = await Booking.find(filter)
      .populate('healthCenter', 'name address phone')
      .populate('diagnosticTest', 'name description instructions')
      .populate('slot', 'slotDate startTime endTime status')
      .sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  bookAppointment,
  updateAppointment,
  deleteAppointment,
  getCenterAppointments,
  getAllAppointmentsAdmin,
  getAppointmentById,
  getUserAppointments,
};