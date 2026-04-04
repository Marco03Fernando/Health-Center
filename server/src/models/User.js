// server/src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,   
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'CENTER_ADMIN', 'PATIENT', 'PHARMACIST'],
      default: 'PATIENT',
    },
    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'centers',
      default: null,
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

module.exports = mongoose.model('users', UserSchema); 