const jwt = require("jsonwebtoken");
const User = require("../models/doctorChanneling/user.model");
const Admin = require("../models/doctorChanneling/Admin/Admin");

async function protect(req, res, next) {
  try {
    // 1) SESSION AUTH SUPPORT
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({ message: "User not authorized" });
      }

      req.user = user;
      return next();
    }

    let token;

    // 2) JWT AUTH SUPPORT
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

    if (decoded.accountType === "user") {
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return res.status(401).json({ message: "User not authorized" });
      }

      req.user = user;
      return next();
    }

    if (decoded.accountType === "admin") {
      const admin = await Admin.findById(decoded.id);

      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin not authorized" });
      }

      req.admin = admin;
      return next();
    }

    return res.status(401).json({ message: "Invalid token type" });
  } catch (err) {
    console.error("Protect middleware error:", err);
    return res.status(401).json({ message: "Not authorized" });
  }
}

module.exports = { protect };