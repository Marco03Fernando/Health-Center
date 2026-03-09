const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");

const Prescription = require("../../models/doctorChanneling/prescription.model");
const Counter = require("../../models/doctorChanneling/counter.model");
const Appointment = require("../../models/doctorChanneling/appointment.model");
const ApiError = require("../../utils/ApiError");

async function getNextPrescriptionNo(session) {
  const c = await Counter.findOneAndUpdate(
    { key: "prescription" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  ).lean();

  return "P" + String(c.seq).padStart(4, "0"); // P0001
}

async function create(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { appointmentId, diagnosis, notes, items, status } = req.body;

    if (!appointmentId) throw new ApiError(400, "appointmentId is required");
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) throw new ApiError(400, "Invalid appointmentId");

    const safeItems = Array.isArray(items) ? items : [];
    for (const it of safeItems) {
      if (!it.medicineName || !String(it.medicineName).trim()) {
        throw new ApiError(400, "Each item must have medicineName");
      }
    }

    let createdId = null;

    await session.withTransaction(async () => {
      const appt = await Appointment.findById(appointmentId).session(session).lean();
      if (!appt) throw new ApiError(404, "Appointment not found");

      const existing = await Prescription.findOne({ appointmentId }).session(session).lean();
      if (existing) throw new ApiError(409, "Prescription already exists for this appointment");

      const prescriptionNo = await getNextPrescriptionNo(session);

      const doc = await Prescription.create(
        [
          {
            prescriptionNo,
            centerId: appt.centerId,
            doctorId: appt.doctorId,
            userId: appt.userId,
            appointmentId: appt._id,
            diagnosis: diagnosis || "",
            notes: notes || "",
            items: safeItems,
            status: status || "issued",
          },
        ],
        { session }
      );

      createdId = doc[0]._id;
    });

    const created = await Prescription.findById(createdId).lean();
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid prescription id");

    const doc = await Prescription.findById(id)
      .populate("doctorId", "name specialization clinic fee phone")
      .populate("centerId", "name district")
      .populate("userId", "fullName email phone role")
      .populate({
        path: "appointmentId",
        select: "status createdAt slotId",
        populate: { path: "slotId", select: "date startTime endTime" },
      })
      .lean();

    if (!doc) throw new ApiError(404, "Prescription not found");
    return res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { centerId, userId, status, q, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (centerId) {
      if (!mongoose.Types.ObjectId.isValid(centerId)) throw new ApiError(400, "Invalid centerId");
      filter.centerId = centerId;
    }
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid userId");
      filter.userId = userId;
    }
    if (status) filter.status = status;

    if (q) {
      filter.$or = [
        { prescriptionNo: { $regex: q, $options: "i" } },
        { diagnosis: { $regex: q, $options: "i" } },
      ];
    }

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      Prescription.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
      Prescription.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
    });
  } catch (err) {
    next(err);
  }
}

async function markDispensed(req, res, next) {
  try {
    const { id } = req.params;
    const { dispensedBy, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid prescription id");

    const updated = await Prescription.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "dispensed",
          "pharmacy.dispensedAt": new Date(),
          "pharmacy.dispensedBy": dispensedBy || "pharmacy",
          "pharmacy.remarks": remarks || "",
        },
      },
      { new: true }
    ).lean();

    if (!updated) throw new ApiError(404, "Prescription not found");
    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function downloadPdf(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid prescription id");

    const p = await Prescription.findById(id)
      .populate("doctorId", "name specialization clinic fee phone")
      .populate("centerId", "name district")
      .populate("userId", "fullName email phone role")
      .populate({
        path: "appointmentId",
        select: "createdAt slotId",
        populate: { path: "slotId", select: "date startTime endTime" },
      })
      .lean();

    if (!p) throw new ApiError(404, "Prescription not found");

    const fileName = `${p.prescriptionNo}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(18).text("Prescription", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Prescription No: ${p.prescriptionNo}`);
    doc.text(`Created: ${new Date(p.createdAt).toLocaleString()}`);
    doc.moveDown();

    // Center / Doctor / Patient
    doc.fontSize(12).text(`Center: ${p.centerId?.name || "N/A"} (${p.centerId?.district || "N/A"})`);
    doc.text(`Doctor: ${p.doctorId?.name || "N/A"} | ${p.doctorId?.specialization || "N/A"}`);
    doc.text(`Clinic: ${p.doctorId?.clinic || "N/A"} | Phone: ${p.doctorId?.phone || "N/A"}`);
    doc.moveDown();

    doc.text(
      `Patient: ${p.userId?.fullName || "N/A"} | Phone: ${p.userId?.phone || "N/A"} | Email: ${p.userId?.email || "N/A"}`
    );

    const slot = p.appointmentId?.slotId;
    if (slot) {
      doc.text(`Appointment Slot: ${slot.date} ${slot.startTime}${slot.endTime ? ` - ${slot.endTime}` : ""}`);
    }
    doc.moveDown();

    // Diagnosis/Notes
    if (p.diagnosis) {
      doc.fontSize(12).text(`Diagnosis: ${p.diagnosis}`);
      doc.moveDown(0.5);
    }
    if (p.notes) {
      doc.text(`Notes: ${p.notes}`);
      doc.moveDown();
    }

    // Items
    doc.fontSize(14).text("Medicines", { underline: true });
    doc.moveDown(0.5);

    if (!p.items || p.items.length === 0) {
      doc.fontSize(12).text("No medicines added.");
    } else {
      p.items.forEach((it, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${it.medicineName}`);
        const line = [
          it.dosage ? `Dosage: ${it.dosage}` : null,
          it.frequency ? `Frequency: ${it.frequency}` : null,
          it.duration ? `Duration: ${it.duration}` : null,
          it.quantity ? `Qty: ${it.quantity}` : null,
        ]
          .filter(Boolean)
          .join(" | ");
        if (line) doc.text(`   ${line}`);
        if (it.instructions) doc.text(`   Instructions: ${it.instructions}`);
        doc.moveDown(0.5);
      });
    }

    doc.moveDown();
    doc.fontSize(10).text("Signature: ______________________", { align: "right" });

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getById, list, markDispensed, downloadPdf };