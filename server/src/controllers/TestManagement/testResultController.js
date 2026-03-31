const mongoose = require("mongoose");
const TestResult = require("../../models/TestManagement/TestResult");
const Booking = require("../../models/Appoinment");
require("../../models/DiagnosticTest"); // register 'testType' model for populate

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
      .populate("appointmentId")
      .populate("testTypeId");

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get test result by ID
exports.getTestResultById = async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id)
      .populate("testTypeId");

    if (!result) return res.status(404).json({ success: false, error: "Not found" });

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
      .populate("testTypeId");

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