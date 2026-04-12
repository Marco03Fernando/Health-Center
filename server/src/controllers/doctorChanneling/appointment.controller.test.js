const mongoose = require("mongoose");

jest.mock("../../models/doctorChanneling/appointment.model", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
  db: { collection: jest.fn() },
}));

jest.mock("../../models/doctorChanneling/slot.model", () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../../models/doctorChanneling/doctor.model", () => ({ findById: jest.fn() }));
jest.mock("../../models/doctorChanneling/user.model", () => ({ findById: jest.fn() }));
jest.mock("../../utils/sendAppointmentBookedEmail", () => jest.fn());

const Appointment = require("../../models/doctorChanneling/appointment.model");
const Slot = require("../../models/doctorChanneling/slot.model");
const Doctor = require("../../models/doctorChanneling/doctor.model");
const User = require("../../models/doctorChanneling/user.model");
const sendAppointmentBookedEmail = require("../../utils/sendAppointmentBookedEmail");

const controller = require("./appointment.controller");

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("appointment.controller", () => {
  describe("create", () => {
    test("validates missing fields and passes ApiError to next", async () => {
      const req = { body: {} };
      const next = jest.fn();
      await controller.create(req, {}, next);
      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode || err.status).toBe(400);
    });

    test("creates appointment happy path and triggers email", async () => {
      jest.useFakeTimers();

      const slotId = new mongoose.Types.ObjectId().toString();
      const doctorId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const centerId = new mongoose.Types.ObjectId().toString();

      const slot = { _id: slotId, isActive: true, isBooked: false, doctorId: doctorId, centerId: centerId, save: jest.fn() };
      Slot.findById.mockResolvedValue(slot);

      const doctor = { _id: doctorId, fee: 500, name: "Dr", specialization: "spec", clinic: "cl" };
      Doctor.findById.mockReturnValue({ lean: () => Promise.resolve(doctor) });

      const patient = { _id: userId, fullName: "P", email: "p@example.com", phone: "+1" };
      User.findById.mockReturnValue({ select: () => ({ lean: () => Promise.resolve(patient) }) });

      Appointment.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });

      const created = { _id: new mongoose.Types.ObjectId().toString() };
      Appointment.create.mockResolvedValue(created);

      const populated = {
        _id: created._id,
        userId: { fullName: "P", email: "p@example.com" },
        doctorId: { name: "Dr", specialization: "spec", clinic: "cl", fee: 500 },
        centerId: { name: "C" },
        slotId: { date: "2026-01-01", startTime: "10:00", endTime: "10:30" },
      };

      const findByIdChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(populated),
      };
      Appointment.findById.mockReturnValueOnce(findByIdChain);

      const req = {
        body: { centerId, doctorId, userId, slotId },
        user: null,
        session: null,
      };

      const res = createRes();
      const next = jest.fn();

      await controller.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: populated }));
      expect(slot.save).toHaveBeenCalled();

      // run the setImmediate scheduled email
      jest.runAllTimers();
      expect(sendAppointmentBookedEmail).toHaveBeenCalled();
      jest.useRealTimers();
    });

    test("handles slot not found and forwards error", async () => {
      const slotId = new mongoose.Types.ObjectId().toString();
      const doctorId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const centerId = new mongoose.Types.ObjectId().toString();
      Slot.findById.mockResolvedValue(null);
      // ensure doctor/user chain exist so .lean/.select don't throw
      Doctor.findById.mockReturnValue({ lean: () => Promise.resolve(null) });
      User.findById.mockReturnValue({ select: () => ({ lean: () => Promise.resolve(null) }) });
      const req = { body: { centerId, doctorId, userId, slotId } };
      const next = jest.fn();
      await controller.create(req, {}, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].message).toMatch(/Slot not found/);
    });
  });

  describe("listByUser", () => {
    test("returns 400 for invalid userId", async () => {
      const req = { params: { userId: "bad" }, query: {} };
      const res = createRes();
      const next = jest.fn();
      await controller.listByUser(req, res, next);
      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode || err.status).toBe(400);
    });

    test("searches doctors when q provided and returns paginated results", async () => {
      const uid = new mongoose.Types.ObjectId().toString();
      // mock collection find -> toArray
      const mockToArray = jest.fn().mockResolvedValue([{ _id: "d1" }]);
      const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
      Appointment.db.collection.mockReturnValue({ find: mockFind });

      const items = [{ _id: "a1" }];
      const queryChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(items),
      };
      Appointment.find.mockReturnValueOnce(queryChain);
      Appointment.countDocuments.mockResolvedValueOnce(1);

      const req = { params: { userId: uid }, query: { q: "search", page: "1", limit: "10" } };
      const res = createRes();
      const next = jest.fn();
      await controller.listByUser(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: items }));
    });
  });

  describe("listByDoctor", () => {
    test("returns paginated list and handles q search on users", async () => {
      const docId = new mongoose.Types.ObjectId().toString();
      const mockToArray = jest.fn().mockResolvedValue([{ _id: "u1" }]);
      const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
      Appointment.db.collection.mockReturnValue({ find: mockFind });

      const items = [{ _id: "a1" }];
      const queryChain2 = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(items),
      };
      Appointment.find.mockReturnValueOnce(queryChain2);
      Appointment.countDocuments.mockResolvedValueOnce(1);

      const req = { doctor: { _id: docId }, query: { q: "x", page: "1", limit: "10" } };
      const res = createRes();
      const next = jest.fn();
      await controller.listByDoctor(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: items }));
    });
  });

  describe("cancel", () => {
    test("invalid id forwards 400", async () => {
      const req = { params: { id: "bad" }, query: {} };
      const next = jest.fn();
      await controller.cancel(req, {}, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode || next.mock.calls[0][0].status).toBe(400);
    });

    test("not found forwards 404", async () => {
      Appointment.findById.mockResolvedValueOnce(null);
      const req = { params: { id: new mongoose.Types.ObjectId().toString() }, query: {} };
      const res = createRes();
      const next = jest.fn();
      await controller.cancel(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode || next.mock.calls[0][0].status).toBe(404);
    });

    test("cancels successfully and unbooks slot", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const appt = { _id: id, userId: "u1", status: "pending", slotId: "s1", save: jest.fn() };
      Appointment.findById.mockResolvedValueOnce(appt);
      Slot.findByIdAndUpdate.mockResolvedValueOnce({});
      const req = { params: { id }, query: {} };
      const res = createRes();
      const next = jest.fn();
      await controller.cancel(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(appt.save).toHaveBeenCalled();
    });
  });

  describe("updateAppointmentStatusByDoctor", () => {
    test("invalid id forwards 400", async () => {
      const req = { params: { id: "bad" }, body: { status: "completed" }, doctor: { _id: "d1" } };
      const next = jest.fn();
      await controller.updateAppointmentStatusByDoctor(req, {}, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode || next.mock.calls[0][0].status).toBe(400);
    });

    test("invalid status forwards 400", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const req = { params: { id }, body: { status: "invalid" }, doctor: { _id: "d1" } };
      const next = jest.fn();
      await controller.updateAppointmentStatusByDoctor(req, {}, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode || next.mock.calls[0][0].status).toBe(400);
    });

    test("not found forwards 404", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      Appointment.findById.mockResolvedValueOnce(null);
      const req = { params: { id }, body: { status: "completed" }, doctor: { _id: "d1" } };
      const next = jest.fn();
      await controller.updateAppointmentStatusByDoctor(req, {}, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode || next.mock.calls[0][0].status).toBe(404);
    });

    test("forbidden when doctor mismatch", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const appt = { _id: id, doctorId: "other", status: "pending", save: jest.fn() };
      Appointment.findById.mockResolvedValueOnce(appt);
      const req = { params: { id }, body: { status: "completed" }, doctor: { _id: "d1" } };
      const next = jest.fn();
      await controller.updateAppointmentStatusByDoctor(req, {}, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode || next.mock.calls[0][0].status).toBe(403);
    });

    test("returns early if already completed/no_show", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const appt = { _id: id, doctorId: "d1", status: "completed" };
      Appointment.findById.mockResolvedValueOnce(appt);
      const req = { params: { id }, body: { status: "completed" }, doctor: { _id: "d1" } };
      const res = createRes();
      const next = jest.fn();
      await controller.updateAppointmentStatusByDoctor(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: appt }));
    });

    test("updates status successfully", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const appt = { _id: id, doctorId: "d1", status: "pending", save: jest.fn() };
      Appointment.findById.mockResolvedValueOnce(appt);
      const req = { params: { id }, body: { status: "completed" }, doctor: { _id: "d1" } };
      const res = createRes();
      const next = jest.fn();
      await controller.updateAppointmentStatusByDoctor(req, res, next);
      expect(appt.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: appt }));
    });
  });
});
