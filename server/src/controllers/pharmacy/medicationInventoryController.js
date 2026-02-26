const MedicationInventory = require("../../models/medicationInventory");

const createMedication = async (req, res) => {
  try {
    const med = await MedicationInventory.create(req.body);
    return res.status(201).json(med);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getAllMedications = async (req, res) => {
  try {
    const { search } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { brandName: { $regex: search, $options: "i" } },
        { strength: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const meds = await MedicationInventory.find(filter).sort({ createdAt: -1 });
    return res.json(meds);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getMedicationById = async (req, res) => {
  try {
    const med = await MedicationInventory.findById(req.params.id);
    if (!med) return res.status(404).json({ message: "Medication not found" });
    return res.json(med);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateMedication = async (req, res) => {
  try {
    const med = await MedicationInventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!med) return res.status(404).json({ message: "Medication not found" });
    return res.json(med);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteMedication = async (req, res) => {
  try {
    const med = await MedicationInventory.findByIdAndDelete(req.params.id);
    if (!med) return res.status(404).json({ message: "Medication not found" });
    return res.json({ message: "Medication deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const addBatch = async (req, res) => {
  try {
    const { batchNo, expiryDate, quantity, unitPrice, addedById, addedByName, addedByEmail } = req.body;

    if (!batchNo || !expiryDate || quantity === undefined || !addedById || !addedByName) {
      return res.status(400).json({
        message: "batchNo, expiryDate, quantity, addedById, addedByName are required",
      });
    }

    const med = await MedicationInventory.findById(req.params.id);
    if (!med) return res.status(404).json({ message: "Medication not found" });

    const existing = med.batches.find((b) => b.batchNo === batchNo);

    if (existing) {
      existing.quantity = Number(existing.quantity || 0) + Number(quantity || 0);
      if (expiryDate) existing.expiryDate = expiryDate;
      if (unitPrice !== undefined) existing.unitPrice = unitPrice;

      existing.addedById = addedById;
      existing.addedByName = addedByName;
      existing.addedByEmail = addedByEmail || "";
      existing.addedAt = new Date();
    } else {
      med.batches.push({
        batchNo,
        expiryDate,
        quantity,
        unitPrice: unitPrice ?? 0,
        addedById,
        addedByName,
        addedByEmail: addedByEmail || "",
      });
    }

    await med.save();
    const updated = await MedicationInventory.findById(med._id);
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { batchNo, expiryDate, quantity, unitPrice, addedById, addedByName, addedByEmail } = req.body;

    const med = await MedicationInventory.findById(req.params.id);
    if (!med) return res.status(404).json({ message: "Medication not found" });

    const batch = med.batches.id(batchId);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    if (batchNo !== undefined) batch.batchNo = batchNo;
    if (expiryDate !== undefined) batch.expiryDate = expiryDate;
    if (quantity !== undefined) batch.quantity = quantity;
    if (unitPrice !== undefined) batch.unitPrice = unitPrice;

    if (addedById !== undefined) batch.addedById = addedById;
    if (addedByName !== undefined) batch.addedByName = addedByName;
    if (addedByEmail !== undefined) batch.addedByEmail = addedByEmail;

    await med.save();
    const updated = await MedicationInventory.findById(med._id);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const med = await MedicationInventory.findById(req.params.id);
    if (!med) return res.status(404).json({ message: "Medication not found" });

    const batch = med.batches.id(batchId);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    batch.deleteOne();
    await med.save();

    const updated = await MedicationInventory.findById(med._id);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createMedication,
  getAllMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  addBatch,
  updateBatch,
  deleteBatch,
};