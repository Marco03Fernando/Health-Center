const mongoose = require("mongoose");

const centerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: String,
    district: String,
    phone: String,
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 999 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Center", centerSchema, "centers");
