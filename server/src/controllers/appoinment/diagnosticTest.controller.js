const DiagnosticTest = require("../../models/DiagnosticTest");
const ApiError = require("../../utils/ApiError");

/**
 * @desc    Get all diagnostic tests
 * @route   GET /api/diagnostic-tests
 * @access  Public
 */
exports.getAllTests = async (req, res, next) => {
  try {
    const tests = await DiagnosticTest.find().sort({ name: 1 });
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
 * @route   GET /api/diagnostic-tests/:id
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
 * @route   POST /api/diagnostic-tests
 * @access  Admin
 */
exports.createTest = async (req, res, next) => {
  try {
    const { name, description, preparationInstructions } = req.body;

    // Validate required fields
    if (!name || !preparationInstructions) {
      throw new ApiError(400, "Name and preparation instructions are required");
    }

    const test = await DiagnosticTest.create({
      name,
      description,
      preparationInstructions,
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
 * @route   PUT /api/diagnostic-tests/:id
 * @access  Admin
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
 * @route   DELETE /api/diagnostic-tests/:id
 * @access  Admin
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
