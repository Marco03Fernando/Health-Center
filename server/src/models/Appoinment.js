const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppointmentSlot',
      required: true
    },
    diagnosticTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'testType',
      required: true
    },
    healthCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'centers',
      required: true
    },
    appointmentDate: {
      type: Date,
      default: Date.now
    },
    appointmentStatus: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'CONFIRMED'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('bookings', BookingSchema);