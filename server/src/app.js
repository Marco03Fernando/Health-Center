const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const errorMiddleware = require("./middlewares/error.middleware");

// Routes 
const centerRoutes = require("./modules/centers/center.routes");
const doctorRoutes = require("./modules/doctorChanneling/doctor/doctor.routes");
const slotRoutes = require("./modules/doctorChanneling/slot/slot.routes");
const appointmentRoutes = require("./modules/doctorChanneling/appointment/appointment.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Basic test routes
app.get("/", (req, res) => {
  res.json({ success: true, message: "API running" });
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Health Center API running" });
});

// db ttest
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

module.exports = app;
