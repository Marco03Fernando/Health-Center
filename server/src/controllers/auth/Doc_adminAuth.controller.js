const Admin = require("../../models/doctorChanneling/Admin/Admin");
require("../../models/HealthCenter");
const generateToken = require("../../utils/generateToken");

const isProduction = process.env.NODE_ENV === "production";

// Register first admin manually / via Postman
async function registerAdmin(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await Admin.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({
      name,
      email: normalizedEmail,
      password,
      role: role || "superadmin",
    });

    return res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail })
      .select("+password")
      .populate("centerId", "_id name address district openingTime closingTime");

    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      id: admin._id,
      role: admin.role,
      accountType: "admin",
    });

    req.session.userId = admin._id.toString();
    req.session.role = admin.role;
    req.session.accountType = "admin";

    return req.session.save((saveErr) => {
      if (saveErr) {
        return res.status(500).json({ message: "Failed to create session" });
      }

      return res.json({
        message: "Admin login successful",
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          centerId: admin.centerId?._id || admin.centerId || null,
          centerName: admin.centerId?.name || null,
          centerAddress: admin.centerId?.address || null,
          centerDistrict: admin.centerId?.district || null,
          centerOpeningTime: admin.centerId?.openingTime || null,
          centerClosingTime: admin.centerId?.closingTime || null,
        },
        token,
      });
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAdminMe(req, res) {
  try {
    const admin = await Admin.findById(req.admin._id).populate(
      "centerId",
      "_id name address district openingTime closingTime"
    );

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        centerId: admin.centerId?._id || admin.centerId || null,
        centerName: admin.centerId?.name || null,
        centerAddress: admin.centerId?.address || null,
        centerDistrict: admin.centerId?.district || null,
        centerOpeningTime: admin.centerId?.openingTime || null,
        centerClosingTime: admin.centerId?.closingTime || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function logoutAdmin(req, res) {
  try {
    return req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }

      res.clearCookie("connect.sid", {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
      });

      return res.status(200).json({ message: "Admin logged out successfully" });
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdminMe,
  logoutAdmin,
};