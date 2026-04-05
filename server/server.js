const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

dotenv.config();

connectDB();

const app = express();

app.use(
  cors({
    origin: "http://localhost:8080",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Diagnostic Booking API running 🚀");
});

app.use("/api/test-types", require("./src/routes/TestManagement/testTypeRoutes"));
app.use("/api/test-results", require("./src/routes/TestManagement/testResultRoutes"));

const appointmentSlotRoutes = require("./src/routes/appointmentSlotRoutes");
app.use(appointmentSlotRoutes);

const appointmentRoutes = require("./src/routes/appointmentRoutes");
app.use(appointmentRoutes);

const medicationInventoryRoutes = require("./src/routes/pharmacy/medicationInventoryRoutes");
app.use("/api/medication-inventory", medicationInventoryRoutes);

const pharmacyOrderRoutes = require("./src/routes/pharmacy/pharmacyOrderRoutes");
app.use("/api/pharmacy-orders", pharmacyOrderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));