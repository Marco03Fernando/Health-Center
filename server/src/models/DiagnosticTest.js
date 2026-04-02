const mongoose = require('mongoose');

// Sub-schema for individual measurable parameters
const parameterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  unit: { type: String, required: true, trim: true },
  normalMinValue: { type: Number, required: true },
  normalMaxValue: { type: Number, required: true },
});

const DiagnosticTestSchema = new mongoose.Schema(
  {
    
    testCode: {
      type: String,
      required: [true, 'Test code is required'],
      unique: true,
      trim: true,
      uppercase: true, // keeps codes consistent like DT-ABC123
    },

    name: {
      type: String,
      trim: true,
      required: [true, 'Diagnostic test name is required'],
      unique: true, // prevent duplicate names 
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    category: {
      type: String,
      trim: true,
    },

    // Booking / display info
    price: {
      type: Number,
      min: 0,
    },

    sampleTypes: {
      type: String,
      trim: true,
    },

    instructions: {
      type: String,
      trim: true,
      default: '',
    },

    // Health center this test belongs to
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'centers',
      default: null,
    },

    // Measurable parameters
    parameters: {
      type: [parameterSchema],
      default: [],
    },

    // Doctors who can order this test
    availableDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Use same collection (no change)
const DiagnosticTest = mongoose.model('testType', DiagnosticTestSchema);

module.exports = DiagnosticTest;