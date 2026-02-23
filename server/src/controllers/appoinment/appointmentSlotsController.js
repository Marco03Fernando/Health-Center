const HealthCenter = require('../../models/HealthCenter');
const AppointmentSlot = require('../../models/AppoinmentSlot');

async function generateAppointmentSlots(req, res) {
  try {
    let { healthCenterId, startDateStr, numberOfDays, slotMinutes } = req.body;

    console.log('generateAppointmentSlots called with', { healthCenterId, startDateStr, numberOfDays, slotMinutes });

    if (!healthCenterId) return res.status(400).json({ error: 'healthCenterId is required' });
    if (!startDateStr) return res.status(400).json({ error: 'startDate (YYYY-MM-DD) is required' });

    // sanitize numberOfDays and slotMinutes
    numberOfDays = parseInt(numberOfDays, 10) || 14;
    numberOfDays = Math.min(Math.max(numberOfDays, 1), 14);

    slotMinutes = parseInt(slotMinutes, 10) || 30;

    // parse start date
    const [year, monthStr, dayStr] = startDateStr.split('-');
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(monthStr, 10) - 1;
    const dayNum = parseInt(dayStr, 10);

    if ([yearNum, monthNum, dayNum].some(Number.isNaN)) 
      return res.status(400).json({ error: 'Invalid startDate format' });

    // fetch health center
    const center = await HealthCenter.findById(healthCenterId).lean();
    if (!center) return res.status(404).json({ error: `HealthCenter not found: ${healthCenterId}` });

    const { openingTime, closingTime, name: centerName } = center;
    if (!openingTime || !closingTime) 
      return res.status(400).json({ error: 'Health center must have openingTime and closingTime' });

    // helpers
    const timeToMinutes = (hhmm) => {
      const [hh, mm] = hhmm.split(':').map(Number);
      return hh * 60 + mm;
    };
    const minutesToHHMM = (mins) => {
      const hh = Math.floor(mins / 60);
      const mm = mins % 60;
      const pad = (n) => (n < 10 ? `0${n}` : n);
      return `${pad(hh)}:${pad(mm)}`;
    };

    const openingMin = timeToMinutes(openingTime);
    const closingMin = timeToMinutes(closingTime);
    if (closingMin <= openingMin) 
      return res.status(400).json({ error: 'closingTime must be after openingTime' });

    const createdSlots = [];

    // precompute dates array
    const dates = [];
    for (let d = 0; d < numberOfDays; d++) {
      dates.push(new Date(yearNum, monthNum, dayNum + d, 0, 0, 0, 0));
    }

    // fetch existing slots in one query for the date range
    const existingSlots = await AppointmentSlot.find({
      center: healthCenterId,
      slotDate: { $gte: dates[0], $lte: dates[dates.length - 1] },
    }).lean();

    const existingSet = new Set(
      existingSlots.map(s => `${s.slotDate.toISOString().slice(0, 10)}|${s.startTime}`)
    );

    // generate slots
    for (const currentDate of dates) {
      for (let startMin = openingMin; startMin + slotMinutes <= closingMin; startMin += slotMinutes) {
        const startTimeStr = minutesToHHMM(startMin);
        const endTimeStr = minutesToHHMM(startMin + slotMinutes);
        const key = `${currentDate.toISOString().slice(0, 10)}|${startTimeStr}`;

        if (existingSet.has(key)) continue;

        const slotDoc = new AppointmentSlot({
          center: healthCenterId,
          slotDate: currentDate,
          startTime: startTimeStr,
          endTime: endTimeStr,
          status: 'AVAILABLE',
        });

        try {
          const saved = await slotDoc.save();
          createdSlots.push(saved);
        } catch (err) {
          console.error('Failed to save slot', { date: currentDate, startTime: startTimeStr, err: err.message });
        }
      }
    }

    return res.status(201).json({
      message: `${createdSlots.length} slots successfully created for "${centerName}" from ${startDateStr} to ${dates[dates.length - 1].toISOString().slice(0,10)}`,
      createdSlots
    });

  } catch (err) {
    console.error('generateAppointmentSlots error:', err.message || err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

module.exports = { generateAppointmentSlots };