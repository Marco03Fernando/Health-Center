const mongoose = require('mongoose');

const AppointmentSlotSchema = new mongoose.Schema(

  {
    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "centers",
      required: true,
    },
    slotDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "BOOKED", "CANCELLED"],
      default: "AVAILABLE",
    },
    appoinment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bookings",
      default: null,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      default: null,
    },
  },
);


// Prevent duplicate slots for same center, date and startTime
AppointmentSlotSchema.index({ center: 1, slotDate: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('AppointmentSlot', AppointmentSlotSchema);