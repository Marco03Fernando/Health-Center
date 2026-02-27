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

const medicationInventoryRoutes = require("./src/routes/pharmacy/medicationInventoryRoutes");
app.use("/api/medication-inventory", medicationInventoryRoutes);

const pharmacyOrderRoutes = require("./src/routes/pharmacy/pharmacyOrderRoutes");
app.use("/api/pharmacy-orders", pharmacyOrderRoutes);

app.get("/", (req, res) => {
  res.send("Diagnostic Booking API running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));