const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    batchNo: { type: String, required: true, trim: true },
    expiryDate: { type: Date, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },

    addedById: { type: String, required: true, trim: true }, // pharmacist user _id as string
    addedByName: { type: String, required: true, trim: true },
    addedByEmail: { type: String, default: "", trim: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const medicationInventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brandName: { type: String, trim: true, default: "" },
    strength: { type: String, required: true, trim: true },
    form: {
      type: String,
      required: true,
      enum: ["tablet", "capsule", "syrup", "injection", "cream", "drops", "other"],
      default: "tablet",
    },
    category: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    unit: { type: String, trim: true, default: "units" },
    isActive: { type: Boolean, default: true },

    batches: { type: [batchSchema], default: [] },
  },
  { timestamps: true }
);

// Virtual: totalQuantity = sum of all batch quantities
medicationInventorySchema.virtual("totalQuantity").get(function () {
  return (this.batches || []).reduce((sum, b) => sum + (b.quantity || 0), 0);
});

medicationInventorySchema.set("toJSON", { virtuals: true });
medicationInventorySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("MedicationInventory", medicationInventorySchema);