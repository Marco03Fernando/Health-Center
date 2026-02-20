const appointmentService = require("./appointment.service");

// POST /api/appointments
async function create(req, res, next) {
  try {
    const appt = await appointmentService.createAppointment(req.body);
    return res.status(201).json({ success: true, data: appt });
  } catch (err) {
    next(err);
  }
}

// GET /api/appointments/user/:userId
async function listByUser(req, res, next) {
  try {
    const { userId } = req.params;
    const items = await appointmentService.listUserAppointments(userId);
    return res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/appointments/:id/cancel?userId=...
async function cancel(req, res, next) {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required in query" });
    }
    const appt = await appointmentService.cancelUserAppointment(userId, req.params.id);
    return res.json({ success: true, data: appt });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/appointments/:id/pay
async function pay(req, res, next) {
  try {
    const { method } = req.body; // cash/card/online
    const appt = await appointmentService.markAppointmentPaid({
      appointmentId: req.params.id,
      method,
    });
    return res.json({ success: true, data: appt });
  } catch (err) {
    next(err);
  }
}

// OPTIONAL doctor testing routes (only if your service still exports these)
async function listByDoctor(req, res, next) {
  try {
    const { doctorId } = req.params;
    const items = await appointmentService.listDoctorAppointmentsByDoctorId
      ? appointmentService.listDoctorAppointmentsByDoctorId(doctorId, req.query)
      : appointmentService.listDoctorAppointments(req.query.authUserId, req.query);
    return res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

async function doctorUpdateStatus(req, res, next) {
  try {
    const { doctorId, id } = req.params;
    const { status } = req.body;

    const appt = await appointmentService.updateAppointmentStatusByDoctorId
      ? appointmentService.updateAppointmentStatusByDoctorId(doctorId, id, status)
      : appointmentService.updateAppointmentStatusByDoctor(req.body.authUserId, id, status);

    return res.json({ success: true, data: appt });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  listByUser,
  cancel,
  pay,
  listByDoctor,
  doctorUpdateStatus,
};
