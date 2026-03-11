require("dotenv").config();   // Load environment variables
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("./models/doctorChanneling/user.model");
const errorMiddleware = require("./middlewares/error.middleware");  // Custom error handler

// Session middleware
const session = require("express-session");
const MongoStore = require("connect-mongo").default;  // Use the default export from connect-mongo

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your_secret_key", // Secret to sign session cookie
  resave: false,  // Do not save the session if unmodified
  saveUninitialized: false, // Don't store sessions if they haven't been modified
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day session lifetime
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production (only for HTTPS)
    httpOnly: true,  // Prevent access to cookies via JavaScript (helps prevent XSS attacks)
    sameSite: "strict",  // Prevent cross-site requests (helps prevent CSRF attacks)
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,  // MongoDB URI for storing sessions
    collectionName: "sessions", // Store sessions in the "sessions" collection
  }),
});

// Routes
const centerRoutes = require("./routes/doctorChanneling/center.routes");
const doctorRoutes = require("./routes/doctorChanneling/doctor.routes");
const slotRoutes = require("./routes/doctorChanneling/slot.routes");
const appointmentRoutes = require("./routes/doctorChanneling/appointment.routes");
const prescriptionRoutes = require("./routes/doctorChanneling/prescription.routes");
const adminDoctorRoutes = require("./routes/doctorChanneling/admin/adminDoctor.routes");
const adminAuthRoutes = require("./routes/auth/adminAuth.routes");
const userAuthRoutes = require("./routes/auth/userAuth.routes");

// Set up Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(sessionMiddleware);  // Add session middleware here

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
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/admin/doctors", adminDoctorRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/auth", userAuthRoutes);

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