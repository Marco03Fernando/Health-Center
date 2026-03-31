require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("./models/doctorChanneling/user.model");
const errorMiddleware = require("./middlewares/error.middleware"); // Custom error handler

// Session middleware
const session = require("express-session");
const MongoStore = require("connect-mongo").default; // Use the default export from connect-mongo

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: false,
    httpOnly: true,
    sameSite: "lax",
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
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

// Lab booking routes (diagnostic tests, appointment slots, bookings)
const diagnosticTestRoutes = require("./routes/diagnosticTest.routes");
const labAppointmentRoutes = require("./routes/appointmentRoutes");
const labSlotRoutes = require("./routes/appointmentSlotRoutes");

// models needed for auto slot maintenance
const Doctor = require("./models/doctorChanneling/doctor.model");
const Slot = require("./models/doctorChanneling/slot.model");

// Set up Express app
const app = express();

const DEFAULT_SLOT_WINDOW_DAYS = Number(process.env.DEFAULT_SLOT_WINDOW_DAYS || 14);

// ---------- slot scheduler helpers ----------
function getTodayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysToDateString(baseDateString, daysToAdd) {
  const d = new Date(`${baseDateString}T00:00:00`);
  d.setDate(d.getDate() + Number(daysToAdd || 0));

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getRollingDates(days = DEFAULT_SLOT_WINDOW_DAYS, fromDate = getTodayDateString()) {
  const totalDays = Number(days);
  if (!Number.isInteger(totalDays) || totalDays <= 0) return [];

  const result = [];
  for (let i = 0; i < totalDays; i += 1) {
    result.push(addDaysToDateString(fromDate, i));
  }
  return result;
}

function toMin(hhmm) {
  const parts = String(hhmm).split(":");
  if (parts.length < 2) {
    throw new Error("Invalid time format. Use HH:mm");
  }

  const h = Number(parts[0]);
  const m = Number(parts[1]);

  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    throw new Error("Invalid time format. Use HH:mm");
  }

  return h * 60 + m;
}

function toHHMM(min) {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function buildSlots({ startTime, endTime, durationMin }) {
  const start = toMin(startTime);
  const end = toMin(endTime);
  const step = Number(durationMin);

  if (!Number.isInteger(step) || step <= 0) {
    throw new Error("sessionTime must be a positive integer");
  }

  if (end <= start) {
    throw new Error("endTime must be after startTime");
  }

  const slots = [];
  let current = start;

  while (current + step <= end) {
    slots.push({
      startTime: toHHMM(current),
      endTime: toHHMM(current + step),
    });
    current += step;
  }

  return slots;
}

function getDayKeyFromDateString(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[day];
}

function normalizeWorkingDays(workingDays) {
  const valid = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    return ["mon", "tue", "wed", "thu", "fri"];
  }

  const cleaned = [
    ...new Set(
      workingDays
        .map((d) => String(d).trim().toLowerCase())
        .filter((d) => valid.includes(d))
    ),
  ];

  return cleaned.length ? cleaned : ["mon", "tue", "wed", "thu", "fri"];
}

function normalizeHolidayDates(holidayDates) {
  if (!Array.isArray(holidayDates) || holidayDates.length === 0) {
    return [];
  }

  return [
    ...new Set(
      holidayDates
        .map((d) => String(d).trim())
        .filter(Boolean)
    ),
  ];
}

function filterDatesBySchedule(dates, workingDays = [], holidayDates = []) {
  const workingDaySet = new Set(normalizeWorkingDays(workingDays));
  const holidaySet = new Set(normalizeHolidayDates(holidayDates));

  return dates.filter((date) => {
    if (holidaySet.has(date)) return false;
    const dayKey = getDayKeyFromDateString(date);
    return workingDaySet.has(dayKey);
  });
}

async function insertSlotDocs(slotDocs) {
  let inserted = 0;

  try {
    const result = await Slot.insertMany(slotDocs, { ordered: false });
    inserted = Array.isArray(result) ? result.length : 0;
  } catch (err) {
    if (err && err.writeErrors) {
      inserted =
        Array.isArray(err.insertedDocs)
          ? err.insertedDocs.length
          : err.result?.nInserted || err.result?.result?.nInserted || 0;
    } else {
      throw err;
    }
  }

  return inserted;
}

async function createRollingSlotsForDoctor(doctor, days = DEFAULT_SLOT_WINDOW_DAYS) {
  if (
    !doctor ||
    !doctor._id ||
    !doctor.centerId ||
    !doctor.startTime ||
    !doctor.endTime ||
    !doctor.sessionTime
  ) {
    return { inserted: 0, skipped: true };
  }

  const dates = getRollingDates(days);
  const filteredDates = filterDatesBySchedule(
    dates,
    doctor.workingDays || [],
    doctor.holidayDates || []
  );

  if (!filteredDates.length) {
    return { inserted: 0, skipped: false };
  }

  const pieces = buildSlots({
    startTime: doctor.startTime,
    endTime: doctor.endTime,
    durationMin: doctor.sessionTime,
  });

  const slotDocs = [];
  for (const date of filteredDates) {
    for (const piece of pieces) {
      slotDocs.push({
        centerId: doctor.centerId,
        doctorId: doctor._id,
        date,
        startTime: piece.startTime,
        endTime: piece.endTime,
        isBooked: false,
        isActive: true,
      });
    }
  }

  const inserted = await insertSlotDocs(slotDocs);
  return { inserted, skipped: false };
}

async function deactivateExpiredUnbookedSlots() {
  const today = getTodayDateString();

  return Slot.updateMany(
    {
      date: { $lt: today },
      isBooked: false,
      isActive: true,
    },
    {
      $set: { isActive: false },
    }
  );
}

let slotMaintenanceRunning = false;

async function runSlotMaintenance() {
  if (slotMaintenanceRunning) {
    console.log("Slot maintenance skipped: previous run still in progress");
    return;
  }

  slotMaintenanceRunning = true;

  try {
    console.log("Slot maintenance started");

    const doctors = await Doctor.find({ isActive: true }).lean();

    let totalInserted = 0;
    let processedDoctors = 0;

    for (const doctor of doctors) {
      try {
        const result = await createRollingSlotsForDoctor(
          doctor,
          DEFAULT_SLOT_WINDOW_DAYS
        );

        if (!result.skipped) {
          processedDoctors += 1;
          totalInserted += result.inserted || 0;
        }
      } catch (err) {
        console.error(
          `Slot generation failed for doctor ${doctor._id}:`,
          err.message
        );
      }
    }

    const cleanupResult = await deactivateExpiredUnbookedSlots();

    console.log("Slot maintenance completed", {
      processedDoctors,
      totalInserted,
      cleaned:
        cleanupResult.modifiedCount ??
        cleanupResult.nModified ??
        cleanupResult.n ??
        0,
    });
  } catch (err) {
    console.error("Slot maintenance error:", err.message);
  } finally {
    slotMaintenanceRunning = false;
  }
}

function scheduleDailySlotMaintenance() {
  const now = new Date();
  const next = new Date();

  next.setHours(0, 5, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  const delay = next.getTime() - now.getTime();

  console.log(
    `First slot maintenance scheduled in ${Math.round(delay / 1000)} seconds`
  );

  setTimeout(() => {
    runSlotMaintenance();

    setInterval(() => {
      runSlotMaintenance();
    }, 24 * 60 * 60 * 1000);
  }, delay);
}
// ---------- end slot scheduler helpers ----------

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:8080",
      "http://localhost:8082",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(sessionMiddleware);

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

// Temporary auth test routes
app.get("/api/auth/test", (req, res) => {
  res.json({ ok: true, message: "auth route works" });
});

app.get("/api/admin/auth/test", (req, res) => {
  res.json({ ok: true, message: "admin auth route works" });
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

// Lab booking routes
app.use("/api/lab/diagnostic-tests", diagnosticTestRoutes);
app.use(labAppointmentRoutes);
app.use(labSlotRoutes);

// Lab Test management route
app.use("/api/test-types", require("../../server/src/routes/TestManagement/testTypeRoutes"));
app.use("/api/test-results", require("../../server/src/routes/TestManagement/testResultRoutes"));


// Error handler
app.use(errorMiddleware);

// Database connection setup and server startup
const connectDB = require("./config/db");

const PORT = process.env.PORT || 8081;

(async () => {
  try {
    await connectDB();

    console.log("Mounted /api/auth");
    console.log("Mounted /api/admin/auth");
    console.log("Mounted /api/admin/doctors");

    await runSlotMaintenance();
    scheduleDailySlotMaintenance();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
})();