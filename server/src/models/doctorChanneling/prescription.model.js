const mongoose = require("mongoose");

const prescriptionItemSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    instructions: { type: String, trim: true },
    quantity: { type: Number, min: 1 },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    //  readable number like P0001
    prescriptionNo: { type: String, required: true, unique: true, index: true },

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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
      index: true,
    },

    diagnosis: { type: String, trim: true },
    notes: { type: String, trim: true },

    items: { type: [prescriptionItemSchema], default: [] },

    status: {
      type: String,
      enum: ["draft", "issued", "dispensed", "cancelled"],
      default: "issued",
      index: true,
    },

    pharmacy: {
      dispensedAt: { type: Date },
      dispensedBy: { type: String, trim: true },
      remarks: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

prescriptionSchema.index({ userId: 1, createdAt: -1 });
prescriptionSchema.index({ centerId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Prescription", prescriptionSchema, "prescriptions");