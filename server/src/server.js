require("dotenv").config();   // Load environment variables
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const errorMiddleware = require("./middlewares/error.middleware");  // Custom error handler

// Routes
const centerRoutes = require("./routes/doctorChanneling/center.routes");
const doctorRoutes = require("./routes/doctorChanneling/doctor.routes");
const slotRoutes = require("./routes/doctorChanneling/slot.routes");
const appointmentRoutes = require("./routes/doctorChanneling/appointment.routes");

// Set up Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic test routes
app.get("/", (req, res) => {
  res.json({ success: true, message: "API running" });
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Health Center API running" });
});

// DB test route
app.get("/dbtest", (req, res) => {
  res.json({
    ok: true,
    mongooseState: mongoose.connection.readyState,
  });
});

// Feature routes
app.use("/api/centers", centerRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/appointments", appointmentRoutes);

// Error handler
app.use(errorMiddleware);

// Database connection setup and server startup
const connectDB = require("./config/db");

const PORT = process.env.PORT || 8081;

(async () => {
  try {
    await connectDB();  // Connect to the database
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);  // Exit with failure code
  }
})();