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
const diagnosticTestRoutes = require("./routes/diagnosticTest.routes");
const appointmentSlotRoutes = require("./routes/appointmentSlotRoutes");
const bookingRoutes = require("./routes/appointmentRoutes");

// Set up Express app
const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5176',
    'http://localhost:5174', 
    'http://localhost:5175'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
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
app.use("/api/diagnostic-tests", diagnosticTestRoutes);

// Appointment slot and booking routes (these already have /api/ prefix in their definitions)
app.use(appointmentSlotRoutes);
app.use(bookingRoutes);

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