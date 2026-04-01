/**
 * TestType is now an alias for DiagnosticTest.
 * Both models reference the same MongoDB collection ("testtypes") so no
 * data migration is needed.  All new code should import DiagnosticTest
 * directly; this file exists only to preserve backward-compatible imports.
 */
const DiagnosticTest = require('../DiagnosticTest');

module.exports = DiagnosticTest;