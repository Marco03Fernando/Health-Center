const express = require("express");
const router = express.Router();
const Slot = require("../../models/doctorChanneling/slot.model");

// GET /api/slots?doctorId=...&date=YYYY-MM-DD
router.get("/", async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId) {
      return res.status(400).json({ success: false, message: "doctorId is required" });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: "date is required (YYYY-MM-DD)" });
    }

    const slots = await Slot.find({
      doctorId,
      date,
      isBooked: false
    }).sort({ startTime: 1 });

    return res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
