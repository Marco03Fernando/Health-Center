jest.mock("../../models/DiagnosticTest", () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

const DiagnosticTest = require("../../models/DiagnosticTest");
const controller = require("./testTypeController");

function createRes() {
  const headers = {};
  return {
    status: jest.fn().mockImplementation(function (s) { this._status = s; return this; }),
    json: jest.fn().mockImplementation(function (j) { this._json = j; return this; }),
    _headers: headers,
  };
}

beforeEach(() => jest.clearAllMocks());

describe("testTypeController", () => {
  describe("createTestType", () => {
    test("returns 400 when required fields missing", async () => {
      const req = { body: { name: "OnlyName" } };
      const res = createRes();
      await controller.createTestType(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res._json.message).toMatch(/required/);
    });

    test("creates and returns test type on success", async () => {
      const body = { testCode: "T1", name: "Test 1", parameters: undefined };
      const created = { _id: "1", ...body };
      DiagnosticTest.create.mockResolvedValue(created);
      const req = { body };
      const res = createRes();
      await controller.createTestType(req, res);
      expect(DiagnosticTest.create).toHaveBeenCalledWith(expect.objectContaining({ testCode: "T1", name: "Test 1" }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res._json).toBe(created);
    });

    test("handles duplicate key error (11000)", async () => {
      DiagnosticTest.create.mockRejectedValueOnce({ code: 11000 });
      const req = { body: { testCode: "T", name: "N" } };
      const res = createRes();
      await controller.createTestType(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res._json.message).toMatch(/already exists/);
    });

    test("handles generic error", async () => {
      DiagnosticTest.create.mockRejectedValueOnce(new Error("boom"));
      const req = { body: { testCode: "T", name: "N" } };
      const res = createRes();
      await controller.createTestType(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res._json.error).toBe("boom");
    });
  });

  describe("getAllTestTypes", () => {
    test("returns list without centerId", async () => {
      DiagnosticTest.find.mockResolvedValueOnce([1,2]);
      const req = { query: {} };
      const res = createRes();
      await controller.getAllTestTypes(req, res);
      expect(DiagnosticTest.find).toHaveBeenCalledWith({});
      expect(res._json).toEqual([1,2]);
    });

    test("filters by centerId", async () => {
      DiagnosticTest.find.mockResolvedValueOnce([]);
      const req = { query: { centerId: "c1" } };
      const res = createRes();
      await controller.getAllTestTypes(req, res);
      expect(DiagnosticTest.find).toHaveBeenCalledWith({ centerId: "c1" });
    });

    test("handles error", async () => {
      DiagnosticTest.find.mockRejectedValueOnce(new Error("fail"));
      const req = { query: {} };
      const res = createRes();
      await controller.getAllTestTypes(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res._json.error).toBe("fail");
    });
  });

  describe("getTestTypeById", () => {
    test("returns 404 when not found", async () => {
      DiagnosticTest.findById.mockResolvedValueOnce(null);
      const req = { params: { id: "x" } };
      const res = createRes();
      await controller.getTestTypeById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns found test type", async () => {
      const obj = { _id: "x" };
      DiagnosticTest.findById.mockResolvedValueOnce(obj);
      const req = { params: { id: "x" } };
      const res = createRes();
      await controller.getTestTypeById(req, res);
      expect(res._json).toBe(obj);
    });

    test("handles error", async () => {
      DiagnosticTest.findById.mockRejectedValueOnce(new Error("err"));
      const req = { params: { id: "x" } };
      const res = createRes();
      await controller.getTestTypeById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("updateTestType", () => {
    test("returns 404 when not found", async () => {
      DiagnosticTest.findByIdAndUpdate.mockResolvedValueOnce(null);
      const req = { params: { id: "x" }, body: { name: "n" } };
      const res = createRes();
      await controller.updateTestType(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns updated on success", async () => {
      const updated = { _id: "x", name: "n" };
      DiagnosticTest.findByIdAndUpdate.mockResolvedValueOnce(updated);
      const req = { params: { id: "x" }, body: { name: "n" } };
      const res = createRes();
      await controller.updateTestType(req, res);
      expect(res._json).toBe(updated);
    });

    test("handles duplicate key on update", async () => {
      DiagnosticTest.findByIdAndUpdate.mockRejectedValueOnce({ code: 11000 });
      const req = { params: { id: "x" }, body: {} };
      const res = createRes();
      await controller.updateTestType(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("handles generic update error", async () => {
      DiagnosticTest.findByIdAndUpdate.mockRejectedValueOnce(new Error("boom2"));
      const req = { params: { id: "x" }, body: {} };
      const res = createRes();
      await controller.updateTestType(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteTestType", () => {
    test("returns 404 when not found", async () => {
      DiagnosticTest.findByIdAndDelete.mockResolvedValueOnce(null);
      const req = { params: { id: "x" } };
      const res = createRes();
      await controller.deleteTestType(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("deletes and returns message", async () => {
      DiagnosticTest.findByIdAndDelete.mockResolvedValueOnce({ _id: "x" });
      const req = { params: { id: "x" } };
      const res = createRes();
      await controller.deleteTestType(req, res);
      expect(res._json.message).toMatch(/deleted successfully/);
    });

    test("handles error", async () => {
      DiagnosticTest.findByIdAndDelete.mockRejectedValueOnce(new Error("boom3"));
      const req = { params: { id: "x" } };
      const res = createRes();
      await controller.deleteTestType(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
