jest.mock("axios", () => ({ post: jest.fn() }));

jest.mock("../../models/doctorChanneling/user.model", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../../models/doctorChanneling/doctor.model", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../utils/generateToken", () => jest.fn(() => "tok_user"));

const User = require("../../models/doctorChanneling/user.model");
const Doctor = require("../../models/doctorChanneling/doctor.model");
const generateToken = require("../../utils/generateToken");
const controller = require("./userAuth.controller");
const mongoose = require("mongoose");

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    clearCookie: jest.fn(),
  };
}

function makeSelectChain(value) {
  return { select: () => Promise.resolve(value) };
}

beforeEach(() => jest.clearAllMocks());

describe("userAuth.controller", () => {
  describe("registerPatient", () => {
    test("missing fields returns 400", async () => {
      const req = { body: {} };
      const res = createRes();
      await controller.registerPatient(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("existing user returns 400", async () => {
      User.findOne.mockResolvedValueOnce({ _id: "u1" });
      const req = { body: { fullName: "A", phone: "1", email: "a@b", password: "p" } };
      const res = createRes();
      await controller.registerPatient(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("creates user and returns token", async () => {
      const user = { _id: "u1", fullName: "A", phone: "1", email: "a@b", role: "patient", mustChangePassword: false };
      User.findOne.mockResolvedValueOnce(null);
      User.create.mockResolvedValueOnce(user);
      const req = { body: { fullName: "A", phone: "1", email: "a@b", password: "p" } };
      const res = createRes();
      await controller.registerPatient(req, res);
      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: "tok_user" }));
    });
  });

  describe("loginUser", () => {
    test("missing fields returns 400", async () => {
      const req = { body: {} };
      const res = createRes();
      await controller.loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("invalid credentials when not found or inactive", async () => {
      User.findOne.mockReturnValueOnce(makeSelectChain(null));
      const req = { body: { email: "a@b", password: "p" }, session: {} };
      const res = createRes();
      await controller.loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("invalid credentials when password mismatch", async () => {
      const user = { _id: "u1", isActive: true, matchPassword: jest.fn().mockResolvedValue(false) };
      User.findOne.mockReturnValueOnce(makeSelectChain(user));
      const req = { body: { email: "a@b", password: "p" }, session: {} };
      const res = createRes();
      await controller.loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("successful login for doctor includes doctorProfileId and token", async () => {
      const user = { _id: "u1", fullName: "U", phone: "1", email: "a@b", role: "doctor", mustChangePassword: false, isActive: true, matchPassword: jest.fn().mockResolvedValue(true) };
      const doctorProfile = { _id: "d1" };
      User.findOne.mockReturnValueOnce(makeSelectChain(user));
      Doctor.findOne.mockReturnValueOnce(makeSelectChain(doctorProfile));
      const saveMock = jest.fn((cb) => cb && cb(null));
      const req = { body: { email: "a@b", password: "p" }, session: { save: saveMock } };
      const res = createRes();
      await controller.loginUser(req, res);
      expect(generateToken).toHaveBeenCalled();
      expect(req.session.userId).toBe(user._id.toString());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: "tok_user" }));
    });

    test("session save error returns 500", async () => {
      const user = { _id: "u1", isActive: true, matchPassword: jest.fn().mockResolvedValue(true) };
      User.findOne.mockReturnValueOnce(makeSelectChain(user));
      const saveMock = jest.fn((cb) => cb && cb(new Error("fail")));
      const req = { body: { email: "a@b", password: "p" }, session: { save: saveMock } };
      const res = createRes();
      await controller.loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getMe and updateMe", () => {
    test("getMe not found returns 404", async () => {
      User.findById.mockResolvedValueOnce(null);
      const req = { user: { _id: "u1" } };
      const res = createRes();
      await controller.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("getMe returns user with doctorProfileId when doctor", async () => {
      const user = { _id: "u1", role: "doctor", fullName: "U", phone: "1", email: "a@b", mustChangePassword: false };
      User.findById.mockResolvedValueOnce(user);
      Doctor.findOne.mockReturnValueOnce(makeSelectChain({ _id: "d1" }));
      const req = { user: { _id: "u1" } };
      const res = createRes();
      await controller.getMe(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user: expect.objectContaining({ doctorProfileId: "d1" }) }));
    });

    test("updateMe validation and email conflict handling", async () => {
      const req = { userId: "u1", body: { fullName: "N", phone: "1", email: "a@b" } };
      User.findOne.mockResolvedValueOnce({ _id: "other" });
      const res = createRes();
      await controller.updateMe(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("updateMe successful returns updated user", async () => {
      const updated = { _id: "u1", role: "patient", fullName: "N", phone: "1", email: "a@b", mustChangePassword: false };
      User.findOne.mockResolvedValueOnce(null);
      User.findByIdAndUpdate.mockResolvedValueOnce(updated);
      Doctor.findOne.mockReturnValueOnce(makeSelectChain(null));
      const req = { userId: "u1", body: { fullName: "N", phone: "1", email: "a@b" } };
      const res = createRes();
      await controller.updateMe(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user: expect.objectContaining({ id: "u1" }) }));
    });
  });

  describe("changePassword", () => {
    test("validation errors for missing fields or short passwords", async () => {
      const res = createRes();
      await controller.changePassword({ body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);

      await controller.changePassword({ body: { currentPassword: "a", newPassword: "123" } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("not found returns 404", async () => {
      User.findById.mockReturnValueOnce(makeSelectChain(null));
      const req = { body: { currentPassword: "old", newPassword: "newpass" }, userId: "u1" };
      const res = createRes();
      await controller.changePassword(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("incorrect current password returns 400", async () => {
      const user = { matchPassword: jest.fn().mockResolvedValue(false) };
      User.findById.mockReturnValueOnce(makeSelectChain(user));
      const req = { body: { currentPassword: "old", newPassword: "newpass" }, userId: "u1" };
      const res = createRes();
      await controller.changePassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("successful password change saves user", async () => {
      const save = jest.fn().mockResolvedValue(true);
      const user = { matchPassword: jest.fn().mockResolvedValue(true), save, mustChangePassword: true };
      User.findById.mockReturnValueOnce(makeSelectChain(user));
      const req = { body: { currentPassword: "old", newPassword: "newpass" }, userId: "u1" };
      const res = createRes();
      await controller.changePassword(req, res);
      expect(save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Password changed successfully" }));
    });
  });

  describe("logoutUser", () => {
    test("destroy error returns 500", async () => {
      const destroy = jest.fn((cb) => cb && cb(new Error("err")));
      const req = { session: { destroy } };
      const res = createRes();
      await controller.logoutUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test("successful logout clears cookie and returns 200", async () => {
      const destroy = jest.fn((cb) => cb && cb(null));
      const req = { session: { destroy } };
      const res = createRes();
      await controller.logoutUser(req, res);
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
