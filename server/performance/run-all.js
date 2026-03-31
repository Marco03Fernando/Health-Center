// ==============================================================================
// run-all.js — Run every Artillery performance test sequentially and
//              generate a combined HTML report for each one.
//
// Usage:
//   node server/performance/run-all.js
//
// Prerequisites:
//   npm install --save-dev artillery artillery-plugin-metrics-by-endpoint
//
// What this script does:
//   1. Reads the list of YAML test files from the tests/ directory.
//   2. Runs each file with `npx artillery run` using Node's child_process.
//   3. Saves a JSON result file for each test.
//   4. Converts each JSON result to an HTML report via `npx artillery report`.
//   5. Prints a summary of pass/fail to the console.
//
// Output:
//   server/performance/reports/
//     auth.user.json
//     auth.user.html
//     auth.admin.json
//     auth.admin.html
//     ... (one pair per test file)
// ==============================================================================

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ── Paths ─────────────────────────────────────────────────────────────────────
// __dirname resolves to server/performance/
const TESTS_DIR = path.join(__dirname, "tests");
const REPORTS_DIR = path.join(__dirname, "reports");

// Create the reports output directory if it doesn't exist yet.
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// ── Discover test files ───────────────────────────────────────────────────────
// Find all .yml files inside the tests/ folder.
const testFiles = fs
  .readdirSync(TESTS_DIR)
  .filter((f) => f.endsWith(".yml"))
  .sort(); // sort alphabetically for predictable order

console.log(`\nFound ${testFiles.length} performance test file(s):\n`);
testFiles.forEach((f) => console.log(`  • ${f}`));
console.log();

// ── Track results ─────────────────────────────────────────────────────────────
const results = [];

// ── Run each test ─────────────────────────────────────────────────────────────
for (const testFile of testFiles) {
  const testName = path.basename(testFile, ".yml"); // e.g. "auth.user"
  const testPath = path.join(TESTS_DIR, testFile);
  const jsonOutput = path.join(REPORTS_DIR, `${testName}.json`);
  const htmlOutput = path.join(REPORTS_DIR, `${testName}.html`);

  console.log(`━━━ Running: ${testFile} ───────────────────────────────────────`);

  try {
    // Step 1 — Run Artillery and save raw JSON output.
    // --output saves the full metrics JSON so we can convert it to HTML.
    execSync(
      `npx artillery run --output "${jsonOutput}" "${testPath}"`,
      {
        stdio: "inherit", // stream Artillery's live output to this terminal
        cwd: path.join(__dirname, ".."),  // run from server/ so relative paths work
      }
    );

    // Step 2 — Convert JSON report to a human-readable HTML file.
    execSync(
      `npx artillery report --output "${htmlOutput}" "${jsonOutput}"`,
      { stdio: "inherit" }
    );

    results.push({ file: testFile, status: "PASSED" });
    console.log(`✔  ${testFile} — report saved to: reports/${testName}.html\n`);

  } catch (err) {
    // Artillery exits with code 1 if any scenario check fails.
    results.push({ file: testFile, status: "FAILED", error: err.message });
    console.error(`✖  ${testFile} FAILED — see output above\n`);
  }
}

// ── Print summary ─────────────────────────────────────────────────────────────
console.log("\n══════════════════ Performance Test Summary ══════════════════");
for (const r of results) {
  const icon = r.status === "PASSED" ? "✔" : "✖";
  console.log(`  ${icon}  ${r.file.padEnd(45)} ${r.status}`);
}
console.log("═══════════════════════════════════════════════════════════════\n");

console.log(`HTML reports saved to: ${REPORTS_DIR}`);
