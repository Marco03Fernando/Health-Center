const mongoose = require('mongoose');
const AppointmentSlot = require('../../models/AppoinmentSlot');
const Booking = require('../../models/Appoinment');

/**
 * Create a booking for a given slot and user.
 * Expects { slotId, userId, diagnosticTestId? } in body.
 */
async function createAppointment(req, res) {
  const { slotId, userId, diagnosticTestId } = req.body || {};

  if (!slotId || !userId) {
    return res.status(400).json({ error: 'slotId and userId are required' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // load slot within transaction
    const slot = await AppointmentSlot.findById(slotId).session(session);
    if (!slot) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Appointment slot not found' });
    }

    if (slot.status !== 'AVAILABLE') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Slot is not available' });
    }

    // create booking record
    const booking = new Booking({
      user: userId,
      slot: slot._id,
      diagnosticTest: diagnosticTestId || null,
      healthCenter: slot.center,
      appointmentDate: slot.slotDate,
      appointmentStatus: 'CONFIRMED',
    });

    const savedBooking = await booking.save({ session });

    // update slot: mark booked, attach booking and bookedBy
    slot.status = 'BOOKED';
    slot.appoinment = savedBooking._id;
    slot.bookedBy = userId;
    await slot.save({ session });

    await session.commitTransaction();
    session.endSession();

    // return confirmation
    return res.status(201).json({ message: 'Booking confirmed', booking: savedBooking });
  } catch (err) {
    console.error('createAppointment error:', err);
    try {
      await session.abortTransaction();
    } catch (e) {
      console.error('abortTransaction failed', e);
    }
    session.endSession();
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

module.exports = { createAppointment };
