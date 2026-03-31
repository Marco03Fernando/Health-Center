const mongoose = require('mongoose');

const DiagnosticTestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Diagnostic test name is required'],
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    instructions: {
      type: String,
      trim: true,
      default: '',
      required: [true, 'Preparation instructions are required'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const DiagnosticTest = mongoose.model('testType', DiagnosticTestSchema);

module.exports = DiagnosticTest;
