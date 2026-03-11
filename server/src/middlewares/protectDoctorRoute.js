// src/middlewares/protectDoctorRoute.js

const jwt = require('jsonwebtoken');
const User = require('../models/doctorChanneling/user.model');
const Doctor = require('../models/doctorChanneling/doctor.model');
const ApiError = require('../utils/ApiError');

const protectDoctorRoute = async (req, res, next) => {
    let token;

    try {
        // Check if authorization header exists
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
            
            // Verify the JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("-password");

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            // Ensure the user is a doctor
            if (user.role !== "doctor") {
                return res.status(403).json({ message: "Not authorized as a doctor" });
            }

            // Fetch the doctor's profile
            const doctor = await Doctor.findOne({ userId: user._id });

            if (!doctor) {
                return res.status(404).json({ message: "Doctor profile not found" });
            }

            req.doctor = doctor;  // Add the doctor's info to the request object for later use
            next();  // Proceed to the next middleware/route handler
        } else {
            return res.status(401).json({ message: "No token provided" });
        }
    } catch (error) {
        console.error("Error in protectDoctorRoute middleware:", error);
        return res.status(401).json({ message: "Not authorized" });
    }
};

module.exports = { protectDoctorRoute };