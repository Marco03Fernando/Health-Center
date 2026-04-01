<<<<<<< HEAD
const mongoose = require("mongoose");

const parameterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  unit: {
    type: String,
    required: true,
  },

  normalMinValue: {
    type: Number,
    required: true,
  },

  normalMaxValue: {
    type: Number,
    required: true,
  },
});

const testTypeSchema = new mongoose.Schema(
  {
    testCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
    },

    category: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    price: {
      type: Number,
      required: true,
    },

    sampleTypes: {
      type: String, // Blood / Urine / etc.
      required: true,
    },

    instructions: {
      type: String,
    },

    parameters: {
      type: [parameterSchema],
      validate: [
        (val) => val.length > 0,
        "At least one parameter is required",
      ],
    },

    availableDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestType", testTypeSchema);
=======
/**
 * TestType is now an alias for DiagnosticTest.
 * Both models reference the same MongoDB collection ("testtypes") so no
 * data migration is needed.  All new code should import DiagnosticTest
 * directly; this file exists only to preserve backward-compatible imports.
 */
const DiagnosticTest = require('../DiagnosticTest');

module.exports = DiagnosticTest;
>>>>>>> main
