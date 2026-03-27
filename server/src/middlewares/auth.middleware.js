const jwt = require("jsonwebtoken");
const User = require("../models/doctorChanneling/user.model");
const Admin = require("../models/doctorChanneling/Admin/Admin");

async function protect(req, res, next) {
  try {
    // SESSION FIRST
    if (req.session && req.session.userId) {
      const { userId, accountType } = req.session;

      if (accountType === "admin") {
        const admin = await Admin.findById(userId);

        if (!admin || !admin.isActive) {
          return res.status(401).json({ message: "Admin not authorized" });
        }

        req.admin = admin;
        req.role = admin.role;
        return next();
      }

      if (accountType === "user") {
        const user = await User.findById(userId);

        if (!user || !user.isActive) {
          return res.status(401).json({ message: "User not authorized" });
        }

        req.user = user;
        req.role = user.role;
        return next();
      }

      return res.status(401).json({ message: "Not authorized" });
    }

    // JWT FALLBACK
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.accountType === "admin") {
      const admin = await Admin.findById(decoded.id);

      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin not authorized" });
      }

      req.admin = admin;
      req.role = admin.role;
      return next();
    }

    if (decoded.accountType === "user") {
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return res.status(401).json({ message: "User not authorized" });
      }

      req.user = user;
      req.role = user.role;
      return next();
    }

    return res.status(401).json({ message: "Invalid token" });
  } catch (err) {
    console.error("Protect error:", err.message);
    return res.status(401).json({ message: "Not authorized" });
  }
}

module.exports = { protect };