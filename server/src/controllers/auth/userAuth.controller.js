const User = require("../../models/doctorChanneling/user.model");
const Doctor = require("../../models/doctorChanneling/doctor.model");
const generateToken = require("../../utils/generateToken");

// Public patient registration only
async function registerPatient(req, res) {
  try {
    const { fullName, phone, email, password } = req.body;

    if (!fullName || !phone || !email || !password) {
      return res.status(400).json({
        message: "fullName, phone, email and password are required",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      fullName,
      phone,
      email,
      password,
      role: "patient",
      mustChangePassword: false,
    });

    const token = generateToken({
      id: user._id,
      role: user.role,
      accountType: "user",
    });

    return res.status(201).json({
      message: "Patient registered successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
      token,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Login for patient / doctor / receptionist / pharmacy
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let doctorProfileId = null;

    if (user.role === "doctor") {
      const doctorProfile = await Doctor.findOne({ userId: user._id }).select("_id");
      doctorProfileId = doctorProfile ? doctorProfile._id : null;
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
      accountType: "user",
    });

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        doctorProfileId,
      },
      token,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getMe(req, res) {
  try {
    const user = req.user;

    let doctorProfileId = null;
    if (user.role === "doctor") {
      const doctorProfile = await Doctor.findOne({ userId: user._id }).select("_id");
      // Check if doctor profile exists
      if (doctorProfile) {
        doctorProfileId = doctorProfile._id;
      } else {
        return res.status(404).json({ message: "Doctor profile not found" });
      }
    }

    return res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        doctorProfileId,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { registerPatient, loginUser, getMe, changePassword };