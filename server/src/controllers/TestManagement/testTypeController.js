const TestType = require("../../models/TestManagement/TestType");

// Create Test Type
exports.createTestType = async (req, res) => {
  try {
    const {
      testCode,
      name,
      description,
      category,
      price,
      sampleTypes,
      instructions,
      parameters,
      availableDoctors,
    } = req.body;

    const testType = await TestType.create({
      testCode,
      name,
      description,
      category,
      price,
      sampleTypes,      // ✅ required
      instructions,
      parameters,
      availableDoctors: availableDoctors || [], // optional, default empty
    });

    res.status(201).json(testType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Test Types
exports.getAllTestTypes = async (req, res) => {
  try {
    const testTypes = await TestType.find();
    res.json(testTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Test Type
exports.getTestTypeById = async (req, res) => {
  try {
    const testType = await TestType.findById(req.params.id);

    if (!testType) {
      return res.status(404).json({ message: "Test Type not found" });
    }

    res.json(testType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Test Type
exports.updateTestType = async (req, res) => {
  try {
    const updatedTestType = await TestType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedTestType) {
      return res.status(404).json({ message: "Test Type not found" });
    }

    res.json(updatedTestType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Test Type
exports.deleteTestType = async (req, res) => {
  try {
    const deleted = await TestType.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Test Type not found" });
    }

    res.json({ message: "Test Type deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};