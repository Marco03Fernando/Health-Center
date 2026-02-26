const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema(
  {
    batchId: { type: mongoose.Schema.Types.ObjectId, required: true },
    batchNoSnapshot: { type: String, required: true },
    expiryDateSnapshot: { type: Date, required: true },

    qty: { type: Number, required: true, min: 1 },
    unitPriceSnapshot: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicationInventory",
      required: true,
    },

    requestedQty: { type: Number, required: true, min: 1 },
    instructions: { type: String, default: "" },

    nameSnapshot: { type: String, required: true },
    strengthSnapshot: { type: String, required: true },
    brandNameSnapshot: { type: String, default: "" },
    formSnapshot: { type: String, default: "" },
    unitSnapshot: { type: String, default: "" },

    allocations: { type: [allocationSchema], default: [] },

    itemTotal: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const pharmacyOrderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true },

    patient: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },

    prescriptionTextSnapshot: { type: String, required: true },

    status: {
      type: String,
      enum: ["CONFIRMED", "WAITING_STOCK"],
      default: "CONFIRMED",
    },

    items: { type: [orderItemSchema], required: true },

    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },

    confirmedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PharmacyOrder", pharmacyOrderSchema);