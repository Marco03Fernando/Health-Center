const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    
    date: { type: String, required: true, index: true }, // "YYYY-MM-DD"
    startTime: { type: String, required: true },         // "09:00"
    endTime: { type: String },

    isBooked: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

// Prevent duplicate slot times for same doctor+date
slotSchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model("Slot", slotSchema, "slots");
