const doctorService = require("../doctor/doctor.service");

async function create(req, res) {
  try {
    const doctor = await doctorService.createDoctor(req.body);
    return res.status(201).json({ doctor });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

async function getById(req, res) {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    return res.json({ doctor });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

async function list(req, res) {
  try {
    const data = await doctorService.listDoctors(req.query);
    return res.json(data);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

async function update(req, res) {
  try {
    const doctor = await doctorService.updateDoctor(req.params.id, req.body);
    return res.json({ doctor });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

async function setActive(req, res) {
  try {
    const { isActive } = req.body; // true/false
    const doctor = await doctorService.setDoctorActive(req.params.id, isActive);
    return res.json({ doctor });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = { create, getById, list, update, setActive };
