const mongoose = require("mongoose");

const resultParameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  normalMinValue: { type: Number },
  normalMaxValue: { type: Number },
});

const testResultSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },

    testTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestType",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },

    status: {
      type: String,
      enum: ["pending", "undergoing", "completed"],
      default: "pending",
    },

    condition: {
      type: String,
      enum: ["normal", "severe"],
    },

    results: {
      type: [resultParameterSchema],
      required: true,
      validate: [
        (val) => val.length > 0,
        "At least one parameter result is required",
      ],
    },

    notes: { type: String },

    recommendConsultation: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestResult", testResultSchema);