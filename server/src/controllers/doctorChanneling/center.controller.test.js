jest.mock("../../models/doctorChanneling/center.model", () => ({
  find: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findById: jest.fn(),
}));

const mongoose = require("mongoose");
const Center = require("../../models/doctorChanneling/center.model");
const controller = require("./center.controller");

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

beforeEach(() => jest.clearAllMocks());

describe("center.controller", () => {
  describe("getCenters", () => {
    test("returns centers list on success", async () => {
      const centers = [{ name: "A" }];
      Center.find.mockReturnValueOnce({ sort: () => Promise.resolve(centers) });
      const req = {};
      const res = createRes();
      const next = jest.fn();
      await controller.getCenters(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: centers });
    });

    test("forwards error to next", async () => {
      Center.find.mockImplementationOnce(() => { throw new Error("fail"); });
      const next = jest.fn();
      await controller.getCenters({}, {}, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("getFeaturedCenters", () => {
    test("returns featured centers with limit", async () => {
      const centers = [{ name: "F" }];
      const chain = { sort: () => ({ limit: () => Promise.resolve(centers) }) };
      Center.find.mockReturnValueOnce(chain);
      const req = { query: { limit: "2" } };
      const res = createRes();
      const next = jest.fn();
      await controller.getFeaturedCenters(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: centers });
    });
  });

  describe("getAllCentersAdmin", () => {
    test("returns all centers", async () => {
      const centers = [{ name: "All" }];
      Center.find.mockReturnValueOnce({ sort: () => Promise.resolve(centers) });
      const res = createRes();
      const next = jest.fn();
      await controller.getAllCentersAdmin({}, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: centers });
    });
  });

  describe("createCenter", () => {
    test("returns 400 when name missing", async () => {
      const req = { body: { name: "" } };
      const res = createRes();
      const next = jest.fn();
      await controller.createCenter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res._json || res.json.mock.calls[0][0]).toBeDefined();
    });

    test("creates center with defaults", async () => {
      const body = { name: " Center ", displayOrder: "5" };
      const created = { _id: "c1", name: "Center" };
      Center.create.mockResolvedValueOnce(created);
      const req = { body };
      const res = createRes();
      const next = jest.fn();
      await controller.createCenter(req, res, next);
      expect(Center.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Center", displayOrder: 5 }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: created }));
    });
  });

  describe("updateCenter", () => {
    test("invalid id returns 400", async () => {
      const req = { params: { id: "bad" }, body: {} };
      const res = createRes();
      const next = jest.fn();
      await controller.updateCenter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("returns 404 when not found", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      Center.findByIdAndUpdate.mockResolvedValueOnce(null);
      const req = { params: { id }, body: { name: "X" } };
      const res = createRes();
      const next = jest.fn();
      await controller.updateCenter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("updates and returns center", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const updated = { _id: id, name: "Y" };
      Center.findByIdAndUpdate.mockResolvedValueOnce(updated);
      const req = { params: { id }, body: { name: " Y " } };
      const res = createRes();
      const next = jest.fn();
      await controller.updateCenter(req, res, next);
      expect(Center.findByIdAndUpdate).toHaveBeenCalledWith(id, expect.objectContaining({ name: "Y" }), expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: updated }));
    });
  });

  describe("toggleCenterActive", () => {
    test("invalid id returns 400", async () => {
      const req = { params: { id: "bad" } };
      const res = createRes();
      const next = jest.fn();
      await controller.toggleCenterActive(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("not found returns 404", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      Center.findById.mockResolvedValueOnce(null);
      const req = { params: { id } };
      const res = createRes();
      const next = jest.fn();
      await controller.toggleCenterActive(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("toggles active and saves", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const center = { _id: id, isActive: true, save: jest.fn() };
      Center.findById.mockResolvedValueOnce(center);
      const req = { params: { id } };
      const res = createRes();
      const next = jest.fn();
      await controller.toggleCenterActive(req, res, next);
      expect(center.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: center }));
    });
  });

  describe("toggleCenterFeatured", () => {
    test("invalid id returns 400", async () => {
      const req = { params: { id: "bad" } };
      const res = createRes();
      const next = jest.fn();
      await controller.toggleCenterFeatured(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("not found returns 404", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      Center.findById.mockResolvedValueOnce(null);
      const req = { params: { id } };
      const res = createRes();
      const next = jest.fn();
      await controller.toggleCenterFeatured(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("toggles featured and saves", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const center = { _id: id, isFeatured: false, save: jest.fn() };
      Center.findById.mockResolvedValueOnce(center);
      const req = { params: { id } };
      const res = createRes();
      const next = jest.fn();
      await controller.toggleCenterFeatured(req, res, next);
      expect(center.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: center }));
    });
  });
});
