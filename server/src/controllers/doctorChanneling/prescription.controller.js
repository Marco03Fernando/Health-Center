const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const Prescription = require("../../models/doctorChanneling/prescription.model");
const Counter = require("../../models/doctorChanneling/counter.model");
const Appointment = require("../../models/doctorChanneling/appointment.model");
const ApiError = require("../../utils/ApiError");

function getActorRole(req) {
  return req.user?.role || req.admin?.role || null;
}

function ensurePatientOwnPrescription(req, prescription) {
  const role = getActorRole(req);

  if (role === "patient") {
    const loggedInUserId = req.user?._id;
    const prescriptionUserId = prescription?.userId?._id || prescription?.userId;

    if (!loggedInUserId || String(prescriptionUserId) !== String(loggedInUserId)) {
      throw new ApiError(403, "You are not allowed to access this prescription");
    }
  }
}

async function getNextPrescriptionNo(session) {
  const c = await Counter.findOneAndUpdate(
    { key: "prescription" },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true, session }
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

    ensurePatientOwnPrescription(req, doc);

    return res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { centerId, userId, status, q, page = 1, limit = 20 } = req.query;

    const filter = {};
    const role = getActorRole(req);

    if (centerId) {
      if (!mongoose.Types.ObjectId.isValid(centerId)) throw new ApiError(400, "Invalid centerId");
      filter.centerId = centerId;
    }

    if (role === "patient") {
      if (!req.user?._id) {
        throw new ApiError(401, "User not authorized");
      }
      filter.userId = req.user._id;
    } else if (userId) {
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
      Prescription.find(filter)
        .populate("doctorId", "name specialization clinic fee phone")
        .populate("centerId", "name district")
        .populate("userId", "fullName email phone role")
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
        .populate("doctorId", "name specialization clinic fee phone")
        .populate("centerId", "name district")
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
      { returnDocument: "after" }
    )
      .populate("doctorId", "name specialization clinic fee phone")
      .populate("centerId", "name district")
      .populate("userId", "fullName email phone role")
      .populate({
        path: "appointmentId",
        select: "status createdAt slotId",
        populate: { path: "slotId", select: "date startTime endTime" },
      })
      .lean();

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
    .text(
      `Issued: ${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}`,
      390,
      68,
      {
        width: 150,
        align: "right",
      }
    );

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

    ensurePatientOwnPrescription(req, p);

    const rawFileName = `${p.prescriptionNo || "prescription"}.pdf`;
    const fileName = rawFileName.replace(/[^\w.-]/g, "_");

    const pdfBuffer = await new Promise((resolve, reject) => {
      const chunks = [];

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

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      try {
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
          { label: "Center", value: p.centerId?.name || "-" },
        ]);

        doc.y = 248;

        drawSectionTitle(doc, "Diagnosis");
        drawTextBox(doc, p.diagnosis || "-");

        ensureSpace(doc, 180);
        drawSectionTitle(doc, "Medicines");

        const items = Array.isArray(p.items) ? p.items : [];
        if (items.length === 0) {
          drawTextBox(doc, "No medicines listed.");
        } else {
          items.forEach((item, index) => {
            ensureSpace(doc, 90);

            const boxY = doc.y;
            doc
              .roundedRect(50, boxY, 495, 70, 12)
              .fillColor("#ffffff")
              .strokeColor("#e2e8f0")
              .lineWidth(1)
              .fillAndStroke();

            drawPill(doc, 64, boxY + 18, 34, 18);

            doc
              .fillColor("#0f172a")
              .font("Helvetica-Bold")
              .fontSize(11)
              .text(`${index + 1}. ${item.medicineName || "-"}`, 110, boxY + 14, {
                width: 320,
              });

            doc
              .font("Helvetica")
              .fontSize(9.5)
              .fillColor("#475569")
              .text(
                `${item.dosage || "-"} • ${item.frequency || "-"} • ${item.duration || "-"}`,
                110,
                boxY + 31,
                { width: 360 }
              );

            doc
              .font("Helvetica")
              .fontSize(9)
              .fillColor("#64748b")
              .text(item.instructions || "-", 110, boxY + 46, { width: 360 });

            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor("#0f172a")
              .text(`Qty: ${item.quantity || 0}`, 455, boxY + 25, {
                width: 70,
                align: "right",
              });

            doc.y = boxY + 86;
          });
        }

        if (p.notes) {
          ensureSpace(doc, 120);
          drawSectionTitle(doc, "Notes");
          drawTextBox(doc, p.notes);
        }

        const pageRange = doc.bufferedPageRange();
        for (let i = 0; i < pageRange.count; i++) {
          doc.switchToPage(i);

          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor("#94a3b8")
            .text(
              `Generated by ${p.centerId?.name || "Medical Center"} • Page ${i + 1} of ${pageRange.count}`,
              50,
              800,
              { width: 495, align: "center" }
            );
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });

    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
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