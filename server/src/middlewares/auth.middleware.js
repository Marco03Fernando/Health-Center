const jwt = require("jsonwebtoken");
const User = require("../models/doctorChanneling/user.model");
const Admin = require("../models/doctorChanneling/Admin/Admin");

async function protect(req, res, next) {
  try {
    let token;

    // Check if the Authorization header contains a Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token extracted:", token); // Log the token to ensure it's being extracted correctly
    }

    // If no token is provided
    if (!token) {
      console.log("No token found in the request."); // Log if no token is found
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Log the decoded token to verify its contents
    console.log("Decoded token:", decoded); // Verify the contents of the decoded token

    // Check the account type in the decoded token
    if (decoded.accountType === "user") {
      console.log("Account type is user. Verifying user...");

      // Log the decoded user ID
      console.log("Decoded user ID:", decoded.id);

      const user = await User.findById(decoded.id);
      console.log("User found in database:", user);  // Log the result of the user lookup

      if (!user || !user.isActive) {
        console.log("User not found or inactive: ", decoded.id); // Log if the user is not found or inactive
        return res.status(401).json({ message: "User not authorized" });
      }

      req.user = user; // Attach the user object to req.user
      console.log("Authenticated user:", req.user); // Log the authenticated user object for debugging
      return next();
    }

    if (decoded.accountType === "admin") {
      console.log("Account type is admin. Verifying admin...");

      // Log the decoded admin ID
      console.log("Decoded admin ID:", decoded.id);

      const admin = await Admin.findById(decoded.id);
      console.log("Admin found in database:", admin);  // Log the result of the admin lookup

      if (!admin || !admin.isActive) {
        console.log("Admin not found or inactive: ", decoded.id); // Log if the admin is not found or inactive
        return res.status(401).json({ message: "Admin not authorized" });
      }

      req.admin = admin; // Attach the admin object to req.admin
      console.log("Authenticated admin:", req.admin); // Log the authenticated admin object for debugging
      return next();
    }

    // If the account type is invalid
    console.log("Invalid token type:", decoded.accountType); // Log if the token type is invalid
    return res.status(401).json({ message: "Invalid token type" });
  } catch (err) {
    // Handle errors, such as expired or malformed token
    console.error("Token verification failed:", err); // Log the error for debugging
    return res.status(401).json({ message: "Not authorized" });
  }
}

module.exports = { protect };