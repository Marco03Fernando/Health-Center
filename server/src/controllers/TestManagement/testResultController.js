const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");

const TestResult = require("../../models/TestManagement/TestResult");
const Booking = require("../../models/Appoinment");
require("../../models/User");
require("../../models/HealthCenter");
require("../../models/DiagnosticTest");
require("../../models/TestManagement/TestType");

// Create new test result
exports.createTestResult = async (req, res) => {
  try {
    const testResult = await TestResult.create(req.body);
    res.status(201).json({ success: true, data: testResult });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all test results (optionally filtered by centerId via related booking)
exports.getAllTestResults = async (req, res) => {
  try {
    const { centerId } = req.query;

    let appointmentIds;
    if (centerId) {
      const bookings = await Booking.find({ healthCenter: centerId }, "_id").lean();
      appointmentIds = bookings.map((b) => b._id);
    }

    const filter = centerId ? { appointmentId: { $in: appointmentIds } } : {};

    const results = await TestResult.find(filter)
      .populate({
        path: "appointmentId",
        populate: [
          { path: "user" },
          { path: "slot" },
          { path: "diagnosticTest" },
          { path: "healthCenter" },
        ],
      })
      .populate("testTypeId")
      .populate("patientId");

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("getAllTestResults error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get test result by ID
exports.getTestResultById = async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id)
      .populate("testTypeId")
      .populate("patientId")
      .populate({
        path: "appointmentId",
        populate: [
          { path: "user" },
          { path: "slot" },
          { path: "diagnosticTest" },
          { path: "healthCenter" },
        ],
      });

    if (!result) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all test results for a specific patient
exports.getTestResultsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, error: "Invalid patient ID" });
    }

    const results = await TestResult.find({ patientId })
      .populate("testTypeId")
      .populate("patientId")
      .populate({
        path: "appointmentId",
        populate: [
          { path: "user" },
          { path: "slot" },
          { path: "diagnosticTest" },
          { path: "healthCenter" },
        ],
      });

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update test result
exports.updateTestResult = async (req, res) => {
  try {
    const result = await TestResult.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!result) return res.status(404).json({ success: false, error: "Not found" });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete test result
exports.deleteTestResult = async (req, res) => {
  try {
    const result = await TestResult.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, error: "Not found" });

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ---------- PDF HELPERS ----------

function formatDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getFlag(value, min, max) {
  if (typeof value !== "number") return "—";
  if (typeof min === "number" && value < min) return "Low";
  if (typeof max === "number" && value > max) return "High";
  return "Normal";
}

function ensureSpace(doc, y, needed = 80) {
  if (y + needed > 740) {
    doc.addPage();
    return 50;
  }
  return y;
}

function drawSoftCard(doc, x, y, w, h, fill = "#f8fafc", stroke = "#e5e7eb") {
  doc
    .save()
    .roundedRect(x, y, w, h, 10)
    .fillAndStroke(fill, stroke)
    .restore();
}

function drawMutedLabel(doc, label, x, y, width = 220) {
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#6b7280")
    .text(label, x, y, { width });
}

function drawStrongValue(doc, value, x, y, width = 220) {
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#111827")
    .text(value || "—", x, y, { width });
}

function drawField(doc, label, value, x, y, width = 220) {
  drawMutedLabel(doc, label, x, y, width);
  drawStrongValue(doc, value, x, y + 12, width);
}

function drawSectionHeader(doc, title, y) {
  doc
    .font("Helvetica-Bold")
    .fontSize(12.5)
    .fillColor("#0f172a")
    .text(title, 50, y);

  doc
    .moveTo(50, y + 18)
    .lineTo(545, y + 18)
    .lineWidth(1)
    .strokeColor("#e2e8f0")
    .stroke();

  return y + 28;
}

function drawBadge(doc, label, value, x, y, color = "#2563eb") {
  const text = `${label}: ${value || "—"}`;
  const paddingX = 10;
  const width = doc.widthOfString(text, { font: "Helvetica-Bold", size: 9 }) + paddingX * 2;

  doc
    .save()
    .roundedRect(x, y, width, 22, 11)
    .fill(color);

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#ffffff")
    .text(text, x + paddingX, y + 7);

  doc.restore();

  return width;
}

function drawDetailCard(doc, title, fields, x, y, w) {
  const rowHeight = 36;
  const headerSpace = 30;
  const padding = 14;
  const h = headerSpace + fields.length * rowHeight + padding;

  drawSoftCard(doc, x, y, w, h, "#f8fafc", "#e2e8f0");

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text(title, x + 14, y + 12);

  let cy = y + 34;
  fields.forEach((field) => {
    drawMutedLabel(doc, field.label, x + 14, cy, w - 28);
    drawStrongValue(doc, field.value, x + 14, cy + 11, w - 28);
    cy += rowHeight;
  });

  return h;
}

function drawSummaryCard(doc, title, fields, y) {
  const x = 50;
  const w = 495;
  const padding = 14;
  const baseH = 74;

  drawSoftCard(doc, x, y, w, baseH, "#f8fafc", "#e2e8f0");

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text(title, x + padding, y + 12);

  const leftX = x + padding;
  const rightX = x + 255;
  const rowY = y + 34;

  drawField(doc, fields[0]?.label || "", fields[0]?.value || "—", leftX, rowY, 180);
  drawField(doc, fields[1]?.label || "", fields[1]?.value || "—", rightX, rowY, 180);

  if (fields[2]) {
    drawField(doc, fields[2].label, fields[2].value, leftX, rowY + 36, 440);
    return baseH + 24;
  }

  return baseH;
}

function drawModernResultTable(doc, rows, startY) {
  let y = startY;

  const colX = {
    parameter: 58,
    result: 235,
    unit: 305,
    range: 360,
    flag: 480,
  };

  doc
    .save()
    .roundedRect(50, y, 495, 26, 8)
    .fill("#0f766e")
    .restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor("#ffffff")
    .text("Parameter", colX.parameter, y + 8, { width: 150 })
    .text("Result", colX.result, y + 8, { width: 55, align: "center" })
    .text("Unit", colX.unit, y + 8, { width: 45, align: "center" })
    .text("Normal Range", colX.range, y + 8, { width: 95, align: "center" })
    .text("Flag", colX.flag, y + 8, { width: 45, align: "center" });

  y += 34;

  rows.forEach((row, index) => {
    y = ensureSpace(doc, y, 34);

    const flag = getFlag(row.value, row.normalMinValue, row.normalMaxValue);
    const isAbnormal = flag === "Low" || flag === "High";

    const bg = isAbnormal
      ? "#fef2f2"
      : index % 2 === 0
      ? "#fcfcfd"
      : "#f8fafc";

    doc
      .save()
      .roundedRect(50, y, 495, 28, 6)
      .fill(bg)
      .restore();

    doc
      .font(isAbnormal ? "Helvetica-Bold" : "Helvetica")
      .fontSize(9.5)
      .fillColor("#111827")
      .text(row.name || "—", colX.parameter, y + 9, { width: 150 });

    doc
      .font("Helvetica")
      .text(
        row.value !== undefined && row.value !== null ? String(row.value) : "—",
        colX.result,
        y + 9,
        { width: 55, align: "center" }
      )
      .text(row.unit || "—", colX.unit, y + 9, { width: 45, align: "center" })
      .text(
        row.normalMinValue !== undefined && row.normalMaxValue !== undefined
          ? `${row.normalMinValue} - ${row.normalMaxValue}`
          : "—",
        colX.range,
        y + 9,
        { width: 95, align: "center" }
      );

    let flagColor = "#111827";
    if (flag === "Low") flagColor = "#b91c1c";
    if (flag === "High") flagColor = "#c2410c";
    if (flag === "Normal") flagColor = "#166534";

    doc
      .font("Helvetica-Bold")
      .fillColor(flagColor)
      .text(flag, colX.flag, y + 9, { width: 45, align: "center" });

    y += 34;
  });

  return y;
}

// ---------- GENERATE PDF ----------

exports.generateTestResultPdf = async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id)
      .populate("testTypeId")
      .populate("patientId")
      .populate({
        path: "appointmentId",
        populate: [
          { path: "user" },
          { path: "slot" },
          { path: "diagnosticTest" },
          { path: "healthCenter" },
        ],
      });

    if (!result) {
      return res.status(404).json({ success: false, error: "Test result not found" });
    }

    const patient = result.patientId || result.appointmentId?.user || {};
    const appointment = result.appointmentId || {};
    const center = appointment.healthCenter || {};
    const testType = result.testTypeId || {};

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="test-result-${result._id}.pdf"`
    );

    doc.pipe(res);

    // Page background accents
    doc
      .rect(0, 0, 595, 26)
      .fill("#0f766e");

    doc
      .rect(0, 26, 595, 6)
      .fill("#99f6e4");

    // Header
    doc
      .font("Helvetica-Bold")
      .fontSize(21)
      .fillColor("#0f172a")
      .text(center.name || "Health Center Laboratory", 50, 52);

    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor("#475569")
      .text("Diagnostic Laboratory Services", 50, 77);

    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor("#64748b")
      .text(
        [center.address, center.district].filter(Boolean).join(", ") || "Laboratory Report",
        50,
        91,
        { width: 250 }
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#111827")
      .text("Lab Test Report", 360, 56, {
        width: 185,
        align: "right",
      });

    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor("#64748b")
      .text(`Report ID: ${result._id}`, 350, 84, {
        width: 195,
        align: "right",
      })
      .text(`Generated: ${formatDateTime(new Date())}`, 350, 98, {
        width: 195,
        align: "right",
      });

    doc
      .moveTo(50, 126)
      .lineTo(545, 126)
      .lineWidth(1)
      .strokeColor("#cbd5e1")
      .stroke();

    // Summary badges
    let badgeY = 140;
    let bx = 50;
    bx += drawBadge(doc, "Condition", result.condition || "unknown", bx, badgeY, "#1d4ed8") + 10;
    bx += drawBadge(
      doc,
      "Consultation",
      result.recommendConsultation ? "Recommended" : "Not Required",
      bx,
      badgeY,
      result.recommendConsultation ? "#dc2626" : "#166534"
    ) + 10;
    drawBadge(doc, "Sample", testType.sampleTypes || "—", bx, badgeY, "#0f766e");

    let y = 178;

    // Two-column cards
    const leftCardHeight = drawDetailCard(
      doc,
      "Patient Information",
      [
        { label: "Full Name", value: patient.fullName || "—" },
        { label: "Phone", value: patient.phone || "—" },
        { label: "Email", value: patient.email || "—" },
      ],
      50,
      y,
      238
    );

    const rightCardHeight = drawDetailCard(
      doc,
      "Appointment Information",
      [
        { label: "Appointment ID", value: appointment._id ? String(appointment._id) : "—" },
        { label: "Appointment Date", value: formatDate(appointment.appointmentDate) },
        { label: "Result Status", value: result.status || "—" },
      ],
      307,
      y,
      238
    );

    y += Math.max(leftCardHeight, rightCardHeight) + 20;

    // Test info
    y = drawSectionHeader(doc, "Test Information", y);
    const testInfoHeight = drawSummaryCard(doc, "Test Details", [
      { label: "Test Name", value: testType.name || "—" },
      { label: "Test Code", value: testType.testCode || "—" },
      { label: "Sample Type", value: testType.sampleTypes || "—" },
    ], y);
    y += testInfoHeight + 10;

    drawSoftCard(doc, 50, y, 495, 62, "#f8fafc", "#e2e8f0");
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#0f172a")
      .text("Description", 64, y + 12);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#334155")
      .text(testType.description || "—", 64, y + 30, {
        width: 465,
      });

    y += 78;

    // Result summary
    y = drawSectionHeader(doc, "Result Summary", y);
    const summaryHeight = drawSummaryCard(doc, "Clinical Summary", [
      { label: "Condition", value: result.condition || "—" },
      {
        label: "Consultation Recommended",
        value: result.recommendConsultation ? "Yes" : "No",
      },
      { label: "Notes", value: result.notes || "—" },
    ], y);
    y += summaryHeight + 18;

    y = ensureSpace(doc, y, 160);

    // Table
    y = drawSectionHeader(doc, "Test Result Details", y);
    y = drawModernResultTable(doc, result.results || [], y + 6);

    // Footer
    y = ensureSpace(doc, y, 90);
    y += 20;

    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .lineWidth(1)
      .strokeColor("#e2e8f0")
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#64748b")
      .text(
        "This is a system-generated laboratory report. Please consult a qualified medical professional for clinical interpretation.",
        50,
        y + 12,
        { width: 495, align: "center" }
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#94a3b8")
      .text(
        `${center.name || "Health Center Laboratory"} • Generated on ${formatDateTime(new Date())}`,
        50,
        y + 28,
        { width: 495, align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error("generateTestResultPdf error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};