const mongoose = require("mongoose");
const PharmacyOrder = require("../../models/pharmacyOrder");
const MedicationInventory = require("../../models/medicationInventory");

// ✅ Email utility (make sure this file exists)
const sendInvoiceEmail = require("../../utils/sendInvoiceEmail");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const makeOrderNo = () => {
  const rand = Math.floor(Math.random() * 100000);
  return `PH-${Date.now()}-${rand}`;
};

const toNum = (v) => Number(v || 0);

const sortBatchesFIFO = (batches) =>
  (batches || [])
    .filter((b) => toNum(b.quantity) > 0)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

const createWaitingItem = (med, requestedQty, availableQty, instructions) => ({
  medicationId: med._id,
  requestedQty,
  availableQty,
  shortageQty: Math.max(0, requestedQty - availableQty),
  instructions: instructions || "",
  nameSnapshot: med.name,
  strengthSnapshot: med.strength,
  brandNameSnapshot: med.brandName || "",
  formSnapshot: med.form || "",
  unitSnapshot: med.unit || "",
  allocations: [],
  itemTotal: 0,
});

/**
 * ✅ UPDATED:
 * - Builds a full plan if ALL items available
 * - Otherwise returns waiting = true with ALL out-of-stock items collected
 */
const buildPlannedItems = async (items, session) => {
  const plannedItems = [];
  let subtotal = 0;

  const waitingItems = [];
  let totalNeededShortage = 0;

  for (const it of items) {
    const med = await MedicationInventory.findById(it.medicationId).session(session);
    if (!med) return { error: { status: 404, message: "Medication not found" } };

    const requestedQty = Number(it.qty);
    const batches = sortBatchesFIFO(med.batches);
    const totalAvailable = batches.reduce((sum, b) => sum + toNum(b.quantity), 0);

    // ✅ Collect shortages instead of returning immediately
    if (totalAvailable < requestedQty) {
      const shortage = requestedQty - totalAvailable;
      totalNeededShortage += shortage;

      waitingItems.push(createWaitingItem(med, requestedQty, totalAvailable, it.instructions));
      continue; // keep checking next items too
    }

    // Build allocations if available
    let remaining = requestedQty;
    const allocations = [];
    let itemTotal = 0;

    for (const b of batches) {
      if (remaining <= 0) break;

      const take = Math.min(remaining, toNum(b.quantity));
      const unitPrice = toNum(b.unitPrice);
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

  // ✅ If any shortage exists -> waiting mode with ALL waiting items
  if (waitingItems.length > 0) {
    return {
      waiting: true,
      waitingInfo: {
        waitingItems,
        shortageTotal: totalNeededShortage,
      },
    };
  }

  return { plannedItems, subtotal };
};

const applyDeductions = async (plannedItems, session) => {
  for (const pItem of plannedItems) {
    const med = await MedicationInventory.findById(pItem.medicationId).session(session);
    if (!med) return { error: { status: 404, message: "Medication not found (during deduction)" } };

    for (const alloc of pItem.allocations) {
      const batch = med.batches.id(alloc.batchId);
      if (!batch) {
        return { error: { status: 404, message: "Batch not found (during deduction)" } };
      }

      const currentQty = toNum(batch.quantity);
      if (currentQty < alloc.qty) {
        return {
          error: {
            status: 409,
            message: "Stock changed while updating order. Try again.",
            extra: {
              batchNo: batch.batchNo,
              availableNow: currentQty,
              needed: alloc.qty,
            },
          },
        };
      }

      batch.quantity = currentQty - alloc.qty;
    }

    await med.save({ session });
  }

  return { ok: true };
};

const restorePreviousDeductions = async (order, session) => {
  for (const item of order.items || []) {
    for (const alloc of item.allocations || []) {
      const med = await MedicationInventory.findById(item.medicationId).session(session);
      if (!med) return { error: { status: 404, message: "Medication not found (during restore)" } };

      const batch = med.batches.id(alloc.batchId);
      if (!batch) return { error: { status: 404, message: "Batch not found (during restore)" } };

      batch.quantity = toNum(batch.quantity) + toNum(alloc.qty);
      await med.save({ session });
    }
  }

  return { ok: true };
};

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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const built = await buildPlannedItems(items, session);

      if (built.error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(built.error.status).json({ message: built.error.message });
      }

      // ✅ WAITING_STOCK (now includes ALL shortage items)
      if (built.waiting) {
        const waitingOrder = await PharmacyOrder.create(
          [
            {
              orderNo: makeOrderNo(),
              patient,
              prescriptionTextSnapshot,
              status: "WAITING_STOCK",
              items: built.waitingInfo.waitingItems, // ✅ ALL waiting items
              subtotal: 0,
              total: 0,
            },
          ],
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        // ✅ Send waiting email too
        try {
          await sendInvoiceEmail({
            to: patient.email,
            order: waitingOrder[0],
            mode: "WAITING_STOCK",
            waitingInfo: built.waitingInfo,
          });
        } catch (e) {
          console.log("Waiting email failed:", e.message);
        }

        return res.status(201).json({
          message: "Order created as WAITING_STOCK due to insufficient stock",
          waitingInfo: built.waitingInfo,
          order: waitingOrder[0],
        });
      }

      // ✅ CONFIRMED flow
      const deduct = await applyDeductions(built.plannedItems, session);
      if (deduct.error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(deduct.error.status).json({ message: deduct.error.message, ...deduct.error.extra });
      }

      const order = await PharmacyOrder.create(
        [
          {
            orderNo: makeOrderNo(),
            patient,
            prescriptionTextSnapshot,
            status: "CONFIRMED",
            items: built.plannedItems,
            subtotal: built.subtotal,
            total: built.subtotal,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      // ✅ Send invoice email
      try {
        await sendInvoiceEmail({ to: patient.email, order: order[0], mode: "CONFIRMED" });
      } catch (e) {
        console.log("Email failed:", e.message);
      }

      return res.status(201).json(order[0]);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ message: e.message });
    }
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

const updateOrderItems = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, prescriptionTextSnapshot, patient } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "items array is required" });
    }

    for (const it of items) {
      if (!it.medicationId || !isValidObjectId(it.medicationId)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Invalid medicationId" });
      }
      if (!it.qty || Number(it.qty) < 1) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "qty must be >= 1" });
      }
    }

    const order = await PharmacyOrder.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Order not found" });
    }

    // 1) Restore previous allocations
    const restored = await restorePreviousDeductions(order, session);
    if (restored.error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(restored.error.status).json({ message: restored.error.message });
    }

    // 2) Build new plan (now collects all shortages)
    const built = await buildPlannedItems(items, session);
    if (built.error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(built.error.status).json({ message: built.error.message });
    }

    // Optional field updates
    if (patient) order.patient = patient;
    if (prescriptionTextSnapshot) order.prescriptionTextSnapshot = prescriptionTextSnapshot;

    // 3) WAITING_STOCK: save waiting items and email
    if (built.waiting) {
      order.status = "WAITING_STOCK";
      order.items = built.waitingInfo.waitingItems; // ✅ all waiting items
      order.subtotal = 0;
      order.total = 0;

      await order.save({ session });
      await session.commitTransaction();
      session.endSession();

      // ✅ Send waiting email
      try {
        await sendInvoiceEmail({
          to: order.patient.email,
          order,
          mode: "WAITING_STOCK",
          waitingInfo: built.waitingInfo,
        });
      } catch (e) {
        console.log("Waiting email failed:", e.message);
      }

      return res.status(200).json({
        message: "Order updated as WAITING_STOCK due to insufficient stock",
        waitingInfo: built.waitingInfo,
        order,
      });
    }

    // 4) Apply deductions
    const deduct = await applyDeductions(built.plannedItems, session);
    if (deduct.error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(deduct.error.status).json({ message: deduct.error.message, ...deduct.error.extra });
    }

    // 5) Save order confirmed
    order.status = "CONFIRMED";
    order.items = built.plannedItems;
    order.subtotal = built.subtotal;
    order.total = built.subtotal;

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    // ✅ Send confirmed invoice email
    try {
      await sendInvoiceEmail({ to: order.patient.email, order, mode: "CONFIRMED" });
    } catch (e) {
      console.log("Email failed:", e.message);
    }

    return res.status(200).json(order);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderItems,
};