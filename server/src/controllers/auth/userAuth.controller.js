const axios = require("axios");  // Import axios for making API requests
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

    console.log("User registration details are valid, proceeding with registration...");

    const user = await User.create({
      fullName,
      phone,
      email,
      password,
      role: "patient",
      mustChangePassword: false,
    });

    console.log("User created successfully:", user);

    // Generate a token (if you still want to use token-based authentication alongside sessions)
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

    // Store user data in the session
    req.session.userId = user._id;  // Store userId in session
    req.session.role = user.role;   // Store user role in session

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
      // Optional: You can still return a token if you want to support both session and token-based auth
      token: generateToken({
        id: user._id,
        role: user.role,
        accountType: "user",
      }),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Get logged-in user's details
async function getMe(req, res) {
  try {
    const user = await User.findById(req.userId);  // Use req.userId from session

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

// Change password for logged-in user
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    const user = await User.findById(req.userId).select("+password");  // Use req.userId from session
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
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }

      // Clear the session cookie
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { registerPatient, loginUser, getMe, changePassword, logoutUser };