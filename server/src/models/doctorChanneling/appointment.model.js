const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
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

    // ✅ use users collection (manual users now, login later)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
      unique: true, // ✅ prevent double booking at DB level
      index: true,
    },

    note: { type: String, trim: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "no_show", "cancelled"],
      default: "pending",
      index: true,
    },

    payment: {
      status: {
        type: String,
        enum: ["unpaid", "paid", "refunded"],
        default: "unpaid",
        index: true,
      },
      method: {
        type: String,
        enum: ["cash", "card"],
        default: "cash",
      },
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: "LKR" },
      paidAt: { type: Date },
      paidBy: { type: String, enum: ["receptionist"] },
    },

    statusUpdatedAt: { type: Date },
    statusUpdatedBy: { type: String, enum: ["doctor", "patient", "receptionist", "system"] },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, createdAt: -1 });
appointmentSchema.index({ userId: 1, createdAt: -1 });
appointmentSchema.index({ centerId: 1, createdAt: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema, "appointments");
