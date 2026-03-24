const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

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

  return "P" + String(c.seq).padStart(4, "0");
}

async function create(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { appointmentId, diagnosis, notes, items, status } = req.body;

    if (!appointmentId) throw new ApiError(400, "appointmentId is required");
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new ApiError(400, "Invalid appointmentId");
    }

    const safeItems = Array.isArray(items) ? items : [];
    for (const it of safeItems) {
      if (!it.medicineName || !String(it.medicineName).trim()) {
        throw new ApiError(400, "Each item must have medicineName");
      }
    }

    let createdId = null;

    await session.withTransaction(async () => {
      const appt = await Appointment.findById(appointmentId).session(session);
      if (!appt) throw new ApiError(404, "Appointment not found");

      if (req.doctor && String(appt.doctorId) !== String(req.doctor._id)) {
        throw new ApiError(403, "You can only create prescriptions for your own appointments");
      }

      if (appt.status === "cancelled") {
        throw new ApiError(400, "Cannot create prescription for a cancelled appointment");
      }

      if (appt.status === "no_show") {
        throw new ApiError(400, "Cannot create prescription for a no-show appointment");
      }

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

  appt.status = "completed";
appt.statusUpdatedAt = new Date();
appt.statusUpdatedBy = "doctor";

      await appt.save({ session });

      createdId = doc[0]._id;
    });

    const created = await Prescription.findById(createdId)
      .populate("doctorId", "name specialization clinic fee phone")
      .populate("centerId", "name district")
      .populate("userId", "fullName email phone role")
      .populate({
        path: "appointmentId",
        select: "status createdAt slotId",
        populate: { path: "slotId", select: "date startTime endTime" },
      })
      .lean();

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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid prescription id");
    }

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
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function listByDoctor(req, res, next) {
  try {
    const doctorId = req.doctor._id;
    const { status, q, page = 1, limit = 20 } = req.query;

    const filter = { doctorId };

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
      Prescription.find(filter)
        .populate("userId", "fullName email phone")
        .populate({
          path: "appointmentId",
          select: "status createdAt slotId",
          populate: { path: "slotId", select: "date startTime endTime" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Prescription.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function markDispensed(req, res, next) {
  try {
    const { id } = req.params;
    const { dispensedBy, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid prescription id");
    }

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

function drawFallbackLogo(doc, x, y) {
  doc.save();

  doc.roundedRect(x, y, 42, 42, 10).fill("#2563eb");

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("Rx", x, y + 11, { width: 42, align: "center" });

  doc.restore();
}

function drawLogo(doc, x, y) {
  try {
    const logoPath = path.join(__dirname, "../../assets/logo.png");

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, x, y, {
        fit: [42, 42],
        align: "center",
        valign: "center",
      });
    } else {
      drawFallbackLogo(doc, x, y);
    }
  } catch (err) {
    drawFallbackLogo(doc, x, y);
  }
}

function drawPill(doc, x, y, w, h, fill = "#dbeafe", stroke = "#93c5fd") {
  doc.save();
  doc.lineWidth(1);
  doc.fillColor(fill).strokeColor(stroke).roundedRect(x, y, w, h, h / 2).fillAndStroke();
  doc.moveTo(x + w / 2, y).lineTo(x + w / 2, y + h).stroke();
  doc.restore();
}

function drawHeader(doc, p) {
  drawLogo(doc, 50, 45);

  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(p.centerId?.name || "Medical Center", 102, 50, { width: 280 });

  doc
    .fillColor("#475569")
    .font("Helvetica")
    .fontSize(10)
    .text("Medical Prescription", 102, 75);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#0f172a")
    .text(`Prescription No: ${p.prescriptionNo || "-"}`, 390, 52, {
      width: 150,
      align: "right",
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#64748b")
    .text(`Issued: ${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}`, 390, 68, {
      width: 150,
      align: "right",
    });

  doc
    .strokeColor("#e2e8f0")
    .lineWidth(1)
    .moveTo(50, 100)
    .lineTo(545, 100)
    .stroke();
}

function drawInfoCard(doc, x, y, w, h, title, rows) {
  doc.save();

  doc
    .roundedRect(x, y, w, h, 12)
    .fillColor("#f8fafc")
    .strokeColor("#e2e8f0")
    .lineWidth(1)
    .fillAndStroke();

  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(title, x + 14, y + 12, { width: w - 28 });

  let currentY = y + 34;

  rows.forEach((row) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#475569")
      .text(`${row.label}:`, x + 14, currentY, { width: 90 });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#0f172a")
      .text(row.value || "-", x + 82, currentY, { width: w - 96 });

    currentY += 16;
  });

  doc.restore();
}

function drawSectionTitle(doc, title) {
  const titleY = doc.y;

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#0f172a")
    .text(title, 50, titleY);

  doc
    .strokeColor("#dbeafe")
    .lineWidth(2)
    .moveTo(50, titleY + 18)
    .lineTo(130, titleY + 18)
    .stroke();

  doc.y = titleY + 28;
}

function ensureSpace(doc, neededHeight = 100) {
  if (doc.y + neededHeight > 760) {
    doc.addPage();
  }
}

function drawTextBox(doc, text, options = {}) {
  const {
    x = 50,
    width = 495,
    padding = 14,
    minHeight = 58,
    bg = "#f8fafc",
    border = "#e2e8f0",
    fontSize = 10.5,
    textColor = "#0f172a",
  } = options;

  const safeText = text || "-";
  const textHeight = doc.heightOfString(safeText, {
    width: width - padding * 2,
    align: "left",
  });

  const boxHeight = Math.max(minHeight, textHeight + padding * 2);
  const boxY = doc.y;

  doc
    .roundedRect(x, boxY, width, boxHeight, 12)
    .fillColor(bg)
    .strokeColor(border)
    .lineWidth(1)
    .fillAndStroke();

  doc
    .fillColor(textColor)
    .font("Helvetica")
    .fontSize(fontSize)
    .text(safeText, x + padding, boxY + padding, {
      width: width - padding * 2,
      align: "left",
    });

  doc.y = boxY + boxHeight + 18;
}

async function downloadPdf(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid prescription id");
    }

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

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
      info: {
        Title: p.prescriptionNo || "Prescription",
        Author: p.centerId?.name || "Medical Center",
        Subject: "Medical Prescription",
      },
    });

    doc.pipe(res);

    const slot = p.appointmentId?.slotId;
    const appointmentDate = slot?.date || "-";
    const appointmentTime = slot?.startTime
      ? `${slot.startTime}${slot?.endTime ? ` - ${slot.endTime}` : ""}`
      : "-";

    drawHeader(doc, p);

    drawInfoCard(doc, 50, 118, 238, 104, "Patient Details", [
      { label: "Name", value: p.userId?.fullName || "-" },
      { label: "Phone", value: p.userId?.phone || "-" },
      { label: "Appointment", value: appointmentDate },
      { label: "Time", value: appointmentTime },
    ]);

    drawInfoCard(doc, 307, 118, 238, 104, "Doctor Details", [
      { label: "Doctor", value: p.doctorId?.name || "-" },
      { label: "Speciality", value: p.doctorId?.specialization || "-" },
      { label: "Clinic", value: p.doctorId?.clinic || "-" },
      { label: "Status", value: p.status || "issued" },
    ]);

    doc.y = 245;

    if (p.diagnosis) {
      drawSectionTitle(doc, "Diagnosis");
      drawTextBox(doc, p.diagnosis, {
        minHeight: 64,
        fontSize: 10.5,
      });
    }

    drawSectionTitle(doc, "Medicines");

    const items = Array.isArray(p.items) ? p.items : [];

    if (!items.length) {
      drawTextBox(doc, "No medicines added.", {
        minHeight: 50,
        fontSize: 10,
        textColor: "#64748b",
      });
    } else {
      items.forEach((it, idx) => {
        const instructionText = it.instructions ? String(it.instructions) : "";
        const medicineName = it.medicineName || "-";

        const meta = [];
        if (it.dosage) meta.push(`Dosage: ${it.dosage}`);
        if (it.frequency) meta.push(`Frequency: ${it.frequency}`);
        if (it.duration) meta.push(`Duration: ${it.duration}`);
        if (it.quantity) meta.push(`Qty: ${it.quantity}`);

        const metaText = meta.join("   •   ");

        const metaHeight = metaText ? doc.heightOfString(metaText, { width: 390 }) : 0;
        const instructionHeight = instructionText
          ? doc.heightOfString(`Instructions: ${instructionText}`, { width: 390 })
          : 0;

        const boxHeight = Math.max(
          54,
          26 + metaHeight + (instructionText ? instructionHeight + 8 : 0) + 18
        );

        ensureSpace(doc, boxHeight + 20);

        const boxY = doc.y;

        doc
          .roundedRect(50, boxY, 495, boxHeight, 14)
          .fillColor("#ffffff")
          .strokeColor("#e2e8f0")
          .lineWidth(1)
          .fillAndStroke();

        drawPill(doc, 64, boxY + 14, 22, 12);

        doc
          .fillColor("#2563eb")
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(String(idx + 1).padStart(2, "0"), 94, boxY + 14, { width: 24 });

        doc
          .fillColor("#0f172a")
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(medicineName, 122, boxY + 13, { width: 380 });

        let currentY = boxY + 31;

        if (metaText) {
          doc
            .fillColor("#64748b")
            .font("Helvetica")
            .fontSize(9)
            .text(metaText, 122, currentY, { width: 390 });
          currentY += metaHeight + 6;
        }

        if (instructionText) {
          doc
            .fillColor("#475569")
            .font("Helvetica-Oblique")
            .fontSize(9)
            .text(`Instructions: ${instructionText}`, 122, currentY, { width: 390 });
        }

        doc.y = boxY + boxHeight + 12;
      });
    }

    if (p.notes) {
      ensureSpace(doc, 100);
      drawSectionTitle(doc, "Additional Notes");
      drawTextBox(doc, p.notes, {
        minHeight: 60,
        fontSize: 10,
        textColor: "#334155",
      });
    }

    ensureSpace(doc, 90);

    const signY = Math.max(doc.y + 12, 700);

    doc
      .strokeColor("#cbd5e1")
      .moveTo(360, signY)
      .lineTo(520, signY)
      .stroke();

    doc
      .fillColor("#475569")
      .font("Helvetica")
      .fontSize(9)
      .text("Doctor Signature", 395, signY + 6);

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#94a3b8")
        .text(
          `${p.centerId?.name || "Medical Center"} • ${p.prescriptionNo || ""}`,
          50,
          805,
          { width: 495, align: "center" }
        );
    }

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  getById,
  list,
  listByDoctor,
  markDispensed,
  downloadPdf,
};