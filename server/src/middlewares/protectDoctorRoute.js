const User = require("../models/doctorChanneling/user.model");
const Doctor = require("../models/doctorChanneling/doctor.model");

const protectDoctorRoute = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(req.session.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role !== "doctor") {
      return res.status(403).json({ message: "Not authorized as a doctor" });
    }

    const doctor = await Doctor.findOne({ userId: user._id });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    req.userId = user._id;
    req.role = user.role;
    req.doctor = doctor;

    next();
  } catch (error) {
    console.error("Error in protectDoctorRoute middleware:", error);
    return res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = { protectDoctorRoute };