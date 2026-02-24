const TestResult = require("../../models/TestManagement/TestResult");

// Create new test result
exports.createTestResult = async (req, res) => {
  try {
    const testResult = await TestResult.create(req.body);
    res.status(201).json({ success: true, data: testResult });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all test results
exports.getAllTestResults = async (req, res) => {
  try {
    const results = await TestResult.find()
      .populate("appointmentId")
      .populate("testTypeId")
      .populate("patientId")
      .populate("doctorId");
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get test result by ID
exports.getTestResultById = async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id)
      .populate("appointmentId")
      .populate("testTypeId")
      .populate("patientId")
      .populate("doctorId");

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

    // Validate patientId
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, error: "Invalid patient ID" });
    }

    // Fetch test results filtered by patientId
    const results = await TestResult.find({ patientId })
      .populate("testTypeId")   // optional, will show test type details
      .populate("doctorId");    // optional, will show doctor details if model exists

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