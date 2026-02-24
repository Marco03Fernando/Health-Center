<<<<<<< HEAD
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
=======
require("dotenv").config();
const express = require("express");
const connectDB = require("./src/config/db");

connectDB();

const app = express();

app.use(express.json());

const appointmentSlotRoutes = require("./src/routes/appointmentSlotRoutes");
app.use(appointmentSlotRoutes);

const appointmentRoutes = require("./src/routes/appointmentRoutes");
app.use(appointmentRoutes);

app.get("/", (res) => {
  res.send("Diagnostic Booking API running 🚀");
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
>>>>>>> main
