const axios = require("axios");
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
    console.error("Error during patient registration:", err);
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

    req.session.userId = user._id.toString();
    req.session.role = user.role;
    req.session.accountType = "user";

    return req.session.save((saveErr) => {
      if (saveErr) {
        return res.status(500).json({ message: "Failed to create session" });
      }

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
        token: generateToken({
          id: user._id,
          role: user.role,
          accountType: "user",
        }),
      });
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Get logged-in user's details
async function getMe(req, res) {
  try {
    const userId = req.user?._id || req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let doctorProfileId = null;
    if (user.role === "doctor") {
      const doctorProfile = await Doctor.findOne({ userId: user._id }).select("_id");
      if (doctorProfile) {
        doctorProfileId = doctorProfile._id;
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

// Update logged-in user's profile
async function updateMe(req, res) {
  try {
    const { fullName, phone, email } = req.body;
    const userId = req.user?._id || req.userId;

    if (!fullName || !phone || !email) {
      return res.status(400).json({
        message: "fullName, phone and email are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        fullName: String(fullName).trim(),
        phone: String(phone).trim(),
        email: normalizedEmail,
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let doctorProfileId = null;
    if (user.role === "doctor") {
      const doctorProfile = await Doctor.findOne({ userId: user._id }).select("_id");
      doctorProfileId = doctorProfile ? doctorProfile._id : null;
    }

    return res.json({
      message: "Profile updated successfully",
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

// Change password for logged-in user
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const userId = req.user?._id || req.userId;
    const user = await User.findById(userId).select("+password");

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

// Logout functionality
async function logoutUser(req, res) {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }

      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  registerPatient,
  loginUser,
  getMe,
  updateMe,
  changePassword,
  logoutUser,
};