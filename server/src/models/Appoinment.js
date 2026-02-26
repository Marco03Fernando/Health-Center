const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppointmentSlot',
      required: true
    },
    diagnosticTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiagnosticTest',
      required: true
    },
    healthCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthCenter',
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

module.exports = mongoose.model('Booking', BookingSchema);