const mongoose = require('mongoose');

// Sub-schema for individual measurable parameters (used in result entry)
const parameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, required: true },
  normalMinValue: { type: Number, required: true },
  normalMaxValue: { type: Number, required: true },
});

const DiagnosticTestSchema = new mongoose.Schema(
  {
    // Core identity — auto-generated on creation (DT-XXXXXX)
    testCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // null values are excluded from the unique index
    },

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

    category: {
      type: String,
      trim: true,
    },

    // Booking / display info
    price: {
      type: Number,
    },

    sampleTypes: {
      type: String, // e.g. Blood / Urine / Stool
      trim: true,
    },

    instructions: {
      type: String,
      trim: true,
      default: '',
    },

    // Health center this test belongs to (center-specific filtering)
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'centers',
      default: null,
    },

    // Measurable parameters for result entry
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

// ── Auto-generate testCode before saving ────────────────────────────────────
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'DT-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

DiagnosticTestSchema.pre('save', async function () {
  if (this.testCode) return; // already set — keep it

  // Retry until we find a code not already in use
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generateCode();
    // eslint-disable-next-line no-await-in-loop
    const exists = await mongoose.model('testType').findOne({ testCode: candidate }).lean();
    if (!exists) {
      this.testCode = candidate;
      return;
    }
  }

  throw new Error('Failed to generate a unique test code — please try again');
});

// Re-use existing collection name so no data migration is required
const DiagnosticTest = mongoose.model('testType', DiagnosticTestSchema);

module.exports = DiagnosticTest;
