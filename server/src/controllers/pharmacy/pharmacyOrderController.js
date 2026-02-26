const mongoose = require("mongoose");
const PharmacyOrder = require("../../models/pharmacyOrder");
const MedicationInventory = require("../../models/medicationInventory");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createOrder = async (req, res) => {
  try {
    const { patient, prescriptionTextSnapshot, items } = req.body;

    if (!patient?.name || !patient?.email || !patient?.phone) {
      return res.status(400).json({ message: "patient name, email, phone are required" });
    }
    if (!prescriptionTextSnapshot) {
      return res.status(400).json({ message: "prescriptionTextSnapshot is required" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items array is required" });
    }

    for (const it of items) {
      if (!it.medicationId || !isValidObjectId(it.medicationId)) {
        return res.status(400).json({ message: "Invalid medicationId" });
      }
      if (!it.qty || Number(it.qty) < 1) {
        return res.status(400).json({ message: "qty must be >= 1" });
      }
    }

    // STEP 1: Build a plan (FIFO allocations) WITHOUT saving deductions yet
    const plannedItems = [];
    let subtotal = 0;

    for (const it of items) {
      const med = await MedicationInventory.findById(it.medicationId);
      if (!med) return res.status(404).json({ message: "Medication not found" });

      const requestedQty = Number(it.qty);

      // Sort batches by expiryDate ASC (FIFO), only those with stock
      const batches = (med.batches || [])
        .filter((b) => Number(b.quantity || 0) > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      const totalAvailable = batches.reduce((sum, b) => sum + Number(b.quantity || 0), 0);

      if (totalAvailable < requestedQty) {
        // Create WAITING_STOCK order (no deductions)
        const waitingOrder = await PharmacyOrder.create({
          orderNo: `PH-${Date.now()}`,
          patient,
          prescriptionTextSnapshot,
          status: "WAITING_STOCK",
          items: [
            {
              medicationId: med._id,
              requestedQty,
              instructions: it.instructions || "",
              nameSnapshot: med.name,
              strengthSnapshot: med.strength,
              brandNameSnapshot: med.brandName || "",
              formSnapshot: med.form || "",
              unitSnapshot: med.unit || "",
              allocations: [],
              itemTotal: 0,
            },
          ],
          subtotal: 0,
          total: 0,
        });

        return res.status(201).json({
          message: "Order created as WAITING_STOCK due to insufficient stock",
          needed: requestedQty,
          available: totalAvailable,
          order: waitingOrder,
        });
      }

      // Allocate FIFO
      let remaining = requestedQty;
      const allocations = [];
      let itemTotal = 0;

      for (const b of batches) {
        if (remaining <= 0) break;

        const take = Math.min(remaining, Number(b.quantity));
        const unitPrice = Number(b.unitPrice || 0);
        const lineTotal = take * unitPrice;

        allocations.push({
          batchId: b._id,
          batchNoSnapshot: b.batchNo,
          expiryDateSnapshot: b.expiryDate,
          qty: take,
          unitPriceSnapshot: unitPrice,
          lineTotal,
        });

        itemTotal += lineTotal;
        remaining -= take;
      }

      subtotal += itemTotal;

      plannedItems.push({
        medicationId: med._id,
        requestedQty,
        instructions: it.instructions || "",
        nameSnapshot: med.name,
        strengthSnapshot: med.strength,
        brandNameSnapshot: med.brandName || "",
        formSnapshot: med.form || "",
        unitSnapshot: med.unit || "",
        allocations,
        itemTotal,
      });
    }

    // STEP 2: Apply deductions (because everything is available)
    for (const pItem of plannedItems) {
      const med = await MedicationInventory.findById(pItem.medicationId);
      if (!med) return res.status(404).json({ message: "Medication not found (during deduction)" });

      for (const alloc of pItem.allocations) {
        const batch = med.batches.id(alloc.batchId);
        if (!batch) return res.status(404).json({ message: "Batch not found (during deduction)" });

        const currentQty = Number(batch.quantity || 0);
        if (currentQty < alloc.qty) {
          return res.status(409).json({
            message: "Stock changed while creating order. Try again.",
            batchNo: batch.batchNo,
            availableNow: currentQty,
            needed: alloc.qty,
          });
        }

        batch.quantity = currentQty - alloc.qty;
      }

      await med.save();
    }

    const order = await PharmacyOrder.create({
      orderNo: `PH-${Date.now()}`,
      patient,
      prescriptionTextSnapshot,
      status: "CONFIRMED",
      items: plannedItems,
      subtotal,
      total: subtotal,
    });

    // Email placeholder (later replace with nodemailer)
    console.log(`EMAIL -> ${patient.email} | Order: ${order.orderNo} | Total: ${order.total}`);

    return res.status(201).json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await PharmacyOrder.find().sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await PharmacyOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// No delete. Update only patient/prescription/status (does NOT re-deduct inventory)
const updateOrder = async (req, res) => {
  try {
    const allowed = {};
    if (req.body.patient) allowed.patient = req.body.patient;
    if (req.body.prescriptionTextSnapshot) allowed.prescriptionTextSnapshot = req.body.prescriptionTextSnapshot;
    if (req.body.status) allowed.status = req.body.status;

    const order = await PharmacyOrder.findByIdAndUpdate(req.params.id, allowed, {
      new: true,
      runValidators: true,
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
};