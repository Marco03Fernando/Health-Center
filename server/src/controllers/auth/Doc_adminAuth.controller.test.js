jest.mock("../../models/doctorChanneling/Admin/Admin", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../../utils/generateToken", () => jest.fn(() => "tok_123"));

const Admin = require("../../models/doctorChanneling/Admin/Admin");
const generateToken = require("../../utils/generateToken");
const controller = require("./Doc_adminAuth.controller");

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    clearCookie: jest.fn(),
  };
}

function makeFindOneChain(value) {
  return {
    select: () => ({ populate: () => Promise.resolve(value) }),
    populate: () => Promise.resolve(value),
  };
}

beforeEach(() => jest.clearAllMocks());

describe("Doc_adminAuth.controller", () => {
  describe("registerAdmin", () => {
    test("missing fields returns 400", async () => {
      const req = { body: {} };
      const res = createRes();
      await controller.registerAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("existing admin returns 400", async () => {
      Admin.findOne.mockResolvedValueOnce({ _id: "a1" });
      const req = { body: { name: "x", email: "e@x", password: "p" } };
      const res = createRes();
      await controller.registerAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("creates admin and returns 201", async () => {
      const admin = { _id: "a1", name: "A", email: "a@b", role: "superadmin" };
      Admin.findOne.mockResolvedValueOnce(null);
      Admin.create.mockResolvedValueOnce(admin);
      const req = { body: { name: "A", email: "A@B", password: "p" } };
      const res = createRes();
      await controller.registerAdmin(req, res);
      expect(Admin.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ admin: expect.objectContaining({ id: admin._id }) }));
    });
  });

  describe("loginAdmin", () => {
    test("missing fields returns 400", async () => {
      const req = { body: {} };
      const res = createRes();
      await controller.loginAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("invalid credentials when not found or inactive", async () => {
      Admin.findOne.mockReturnValueOnce(makeFindOneChain(null));
      const req = { body: { email: "a@b", password: "p" }, session: {} };
      const res = createRes();
      await controller.loginAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("invalid credentials when password mismatch", async () => {
      const admin = { _id: "a1", isActive: true, matchPassword: jest.fn().mockResolvedValue(false) };
      Admin.findOne.mockReturnValueOnce(makeFindOneChain(admin));
      const req = { body: { email: "a@b", password: "p" }, session: {} };
      const res = createRes();
      await controller.loginAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("successful login saves session and returns token", async () => {
      const admin = {
        _id: "a1",
        name: "A",
        email: "a@b",
        role: "admin",
        isActive: true,
        matchPassword: jest.fn().mockResolvedValue(true),
        centerId: { _id: "c1", name: "C" },
      };

      Admin.findOne.mockReturnValueOnce(makeFindOneChain(admin));
      const saveMock = jest.fn((cb) => cb && cb(null));
      const req = { body: { email: "a@b", password: "p" }, session: { save: saveMock } };
      const res = createRes();
      await controller.loginAdmin(req, res);
      expect(generateToken).toHaveBeenCalled();
      expect(req.session.userId).toBe(admin._id.toString());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: "tok_123" }));
    });

    test("session save error returns 500", async () => {
      const admin = { _id: "a1", isActive: true, matchPassword: jest.fn().mockResolvedValue(true) };
      Admin.findOne.mockReturnValueOnce(makeFindOneChain(admin));
      const saveMock = jest.fn((cb) => cb && cb(new Error("savefail")));
      const req = { body: { email: "a@b", password: "p" }, session: { save: saveMock } };
      const res = createRes();
      await controller.loginAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getAdminMe", () => {
    test("not found returns 404", async () => {
      Admin.findById.mockReturnValueOnce({ populate: () => Promise.resolve(null) });
      const req = { admin: { _id: "a1" } };
      const res = createRes();
      await controller.getAdminMe(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns admin profile", async () => {
      const admin = { _id: "a1", name: "A", email: "a@b", role: "admin", centerId: { _id: "c1", name: "C" } };
      Admin.findById.mockReturnValueOnce({ populate: () => Promise.resolve(admin) });
      const req = { admin: { _id: "a1" } };
      const res = createRes();
      await controller.getAdminMe(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ admin: expect.objectContaining({ id: admin._id }) }));
    });
  });

  describe("logoutAdmin", () => {
    test("destroy error returns 500", async () => {
      const destroy = jest.fn((cb) => cb && cb(new Error("err")));
      const req = { session: { destroy } };
      const res = createRes();
      await controller.logoutAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test("successful logout clears cookie and returns 200", async () => {
      const destroy = jest.fn((cb) => cb && cb(null));
      const req = { session: { destroy } };
      const res = createRes();
      await controller.logoutAdmin(req, res);
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
