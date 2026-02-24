const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express
const app = express();

// Middleware
app.use(express.json()); // Allows JSON body parsing

// Sample route (for testing server)
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/test-types", require("./src/routes/TestManagement/testTypeRoutes"));
app.use("/api/test-results", require("./src/routes/TestManagement/testResultRoutes"));

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});