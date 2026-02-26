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

const medicationInventoryRoutes = require("./src/routes/medicationInventoryRoutes");
app.use("/api/medication-inventory", medicationInventoryRoutes);


app.get("/", (req, res) => {
  res.send("Diagnostic Booking API running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));