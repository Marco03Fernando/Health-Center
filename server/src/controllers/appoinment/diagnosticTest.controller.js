const DiagnosticTest = require("../../models/DiagnosticTest");
const ApiError = require("../../utils/ApiError");

/**
 * @desc    Get all diagnostic tests (optionally filtered by centerId)
 * @route   GET /api/lab/diagnostic-tests?centerId=xxx
 * @access  Public
 */
exports.getAllTests = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.centerId) {
      filter.centerId = req.query.centerId;
    }
    const tests = await DiagnosticTest.find(filter).sort({ name: 1 });
    res.json({
      success: true,
      count: tests.length,
      data: tests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single diagnostic test by ID
 * @route   GET /api/lab/diagnostic-tests/:id
 * @access  Public
 */
exports.getTestById = async (req, res, next) => {
  try {
    const test = await DiagnosticTest.findById(req.params.id);
    
    if (!test) {
      throw new ApiError(404, "Diagnostic test not found");
    }

    res.json({
      success: true,
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new diagnostic test
 * @route   POST /api/lab/diagnostic-tests
 * @access  Admin / Lab-Tech
 */
exports.createTest = async (req, res, next) => {
  try {
    const {
      name,
      description,
      instructions,
      category,
      price,
      sampleTypes,
      parameters,
      centerId,
    } = req.body;

    if (!name) {
      throw new ApiError(400, "Name is required");
    }

    // testCode is intentionally omitted — the model pre-save hook generates it
    const test = await DiagnosticTest.create({
      name,
      description,
      instructions,
      category,
      price,
      sampleTypes,
      parameters: parameters || [],
      centerId: centerId || null,
    });

    res.status(201).json({
      success: true,
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update diagnostic test
 * @route   PUT /api/lab/diagnostic-tests/:id
 * @access  Admin / Lab-Tech
 */
exports.updateTest = async (req, res, next) => {
  try {
    const test = await DiagnosticTest.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!test) {
      throw new ApiError(404, "Diagnostic test not found");
    }

    res.json({
      success: true,
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete diagnostic test (soft delete)
 * @route   DELETE /api/lab/diagnostic-tests/:id
 * @access  Admin / Lab-Tech
 */
exports.deleteTest = async (req, res, next) => {
  try {
    const test = await DiagnosticTest.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!test) {
      throw new ApiError(404, "Diagnostic test not found");
    }

    res.json({
      success: true,
      message: "Diagnostic test deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
