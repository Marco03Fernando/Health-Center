const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
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
    
    isActive: {type: Boolean, default: true, index: true}


  },
  { timestamps: true }

);

doctorSchema.index({ centerId: 1, isActive: 1, specialization: 1 });

module.exports = mongoose.model("Doctor", doctorSchema, "doctors");
