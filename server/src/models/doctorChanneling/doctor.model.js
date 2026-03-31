const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
      index: true,
    },

    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    clinic: { type: String, required: true, trim: true },
    fee: { type: Number, required: true, min: 0 },
    phone: { type: String, required: true, trim: true },

    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true,
      index: true,
    },

    startTime: { type: String, trim: true }, // "09:00"
    endTime: { type: String, trim: true },   // "17:00"
    sessionTime: { type: Number, min: 1 },   // minutes

    workingDays: {
      type: [String],
      enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      default: ["mon", "tue", "wed", "thu", "fri"],
    },

    holidayDates: {
      type: [String], // ["2026-04-10", "2026-04-11"]
      default: [],
    },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

doctorSchema.index({ centerId: 1, isActive: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ clinic: 1 });

module.exports = mongoose.model("Doctor", doctorSchema, "doctors");