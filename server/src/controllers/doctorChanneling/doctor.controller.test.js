jest.mock("../../models/doctorChanneling/doctor.model", () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock("../../models/doctorChanneling/slot.model", () => ({
  insertMany: jest.fn(),
  deleteMany: jest.fn(),
  updateMany: jest.fn(),
}));

jest.mock("../../models/doctorChanneling/user.model", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const mongoose = require("mongoose");
const Doctor = require("../../models/doctorChanneling/doctor.model");
const Slot = require("../../models/doctorChanneling/slot.model");
const User = require("../../models/doctorChanneling/user.model");
const controller = require("./doctor.controller");

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

beforeEach(() => jest.clearAllMocks());

describe("doctor.controller", () => {
  describe("create", () => {
    test("missing required fields returns 400", async () => {
      const req = { body: {} };
      const res = createRes();
      await controller.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("existing user returns 400", async () => {
      User.findOne.mockReturnValueOnce({ lean: () => Promise.resolve({ _id: "u1" }) });
      const req = { body: { name: "D", fullName: "D", email: "a@b", password: "p", phone: "123", centerId: new mongoose.Types.ObjectId().toString(), specialization: "s", clinic: "c", fee: 10 } };
      const res = createRes();
      await controller.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("creates user and doctor without slots when generateSlots false", async () => {
      User.findOne.mockReturnValueOnce({ lean: () => Promise.resolve(null) });
      const user = { _id: "u1", fullName: "Dr", email: "x@y", role: "doctor", mustChangePassword: true, isActive: true };
      User.create.mockResolvedValueOnce(user);
      const doctor = { _id: "d1", name: "Dr" };
      Doctor.create.mockResolvedValueOnce(doctor);

      const body = { fullName: "Dr", email: "x@y", password: "p", phone: "1", centerId: new mongoose.Types.ObjectId().toString(), specialization: "s", clinic: "c", fee: 5, generateSlots: false };
      const req = { body };
      const res = createRes();
      await controller.create(req, res);
      expect(User.create).toHaveBeenCalled();
      expect(Doctor.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ doctor }));
    });
  });

  describe("getById", () => {
    test("invalid id returns 400", async () => {
      const req = { params: { id: "bad" } };
      const res = createRes();
      await controller.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("not found returns 404", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      Doctor.findById.mockReturnValueOnce({ lean: () => Promise.resolve(null) });
      const req = { params: { id } };
      const res = createRes();
      await controller.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("found returns doctor", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const doc = { _id: id, name: "X" };
      Doctor.findById.mockReturnValueOnce({ lean: () => Promise.resolve(doc) });
      const req = { params: { id } };
      const res = createRes();
      await controller.getById(req, res);
      expect(res.json).toHaveBeenCalledWith({ doctor: doc });
    });
  });

  describe("list", () => {
    test("invalid centerId returns 400", async () => {
      const req = { query: { centerId: "bad" } };
      const res = createRes();
      await controller.list(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("returns items and pagination", async () => {
      const doc = { _id: "d1", name: "A" };
      // mock chainable query
      Doctor.find.mockReturnValueOnce({
        populate: () => ({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => Promise.resolve([doc]) }) }) }) }),
      });
      Doctor.countDocuments.mockResolvedValueOnce(1);

      const req = { query: {} };
      const res = createRes();
      await controller.list(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ items: [doc], pagination: expect.any(Object) }));
    });
  });

  describe("update and setActive", () => {
    test("update invalid id returns 400", async () => {
      const req = { params: { id: "bad" }, body: {} };
      const res = createRes();
      await controller.update(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("update not found returns 404", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      Doctor.findByIdAndUpdate.mockReturnValueOnce({ lean: () => Promise.resolve(null) });
      const req = { params: { id }, body: {} };
      const res = createRes();
      await controller.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("setActive toggles and updates user", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const updated = { _id: id, userId: "u1", isActive: true };
      Doctor.findByIdAndUpdate.mockReturnValueOnce({ lean: () => Promise.resolve(updated) });
      User.findByIdAndUpdate.mockResolvedValueOnce({});
      const req = { params: { id }, body: { isActive: false } };
      const res = createRes();
      await controller.setActive(req, res);
      expect(Doctor.findByIdAndUpdate).toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ doctor: updated }));
    });
  });

  describe("updateProfile and getMe", () => {
    test("updateProfile not found returns 404", async () => {
      Doctor.findOneAndUpdate.mockResolvedValueOnce(null);
      const req = { userId: "u1", body: {} };
      const res = createRes();
      await controller.updateProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("getMe not found returns 404", async () => {
      Doctor.findOne.mockReturnValueOnce({ lean: () => Promise.resolve(null) });
      User.findById.mockReturnValueOnce({ select: () => ({ lean: () => Promise.resolve(null) }) });
      const req = { userId: "u1" };
      const res = createRes();
      await controller.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("generateUpcomingSlots and cleanupExpiredSlots", () => {
    test("generateUpcomingSlots with doctor missing schedule returns details", async () => {
      const doctor = { _id: "d1", name: "X" }; // missing startTime/sessionTime
      Doctor.find.mockReturnValueOnce({ lean: () => Promise.resolve([doctor]) });
      Slot.updateMany.mockResolvedValueOnce({});
      const req = { body: {} };
      const res = createRes();
      await controller.generateUpcomingSlots(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ details: expect.any(Array) }));
    });

    test("cleanupExpiredSlots returns counts", async () => {
      Slot.updateMany.mockResolvedValueOnce({ matchedCount: 2, modifiedCount: 2 });
      const res = createRes();
      await controller.cleanupExpiredSlots({}, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ matchedCount: expect.any(Number), modifiedCount: expect.any(Number) }));
    });
  });
});
