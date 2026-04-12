jest.mock("pdfkit", () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    end: jest.fn(),
    image: jest.fn(),
    roundedRect: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    strokeColor: jest.fn().mockReturnThis(),
    lineWidth: jest.fn().mockReturnThis(),
    fillAndStroke: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    heightOfString: jest.fn().mockReturnValue(10),
    bufferedPageRange: jest.fn().mockReturnValue({ count: 1 }),
    switchToPage: jest.fn().mockReturnThis(),
    y: 100,
  }));
});

jest.mock("../../models/doctorChanneling/prescription.model", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../../models/doctorChanneling/counter.model", () => ({
  findOneAndUpdate: jest.fn(),
}));

jest.mock("../../models/doctorChanneling/appointment.model", () => ({
  findById: jest.fn(),
}));

const mongoose = require("mongoose");
const Prescription = require("../../models/doctorChanneling/prescription.model");
const Counter = require("../../models/doctorChanneling/counter.model");
const Appointment = require("../../models/doctorChanneling/appointment.model");
const controller = require("./prescription.controller");

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    end: jest.fn(),
  };
}

function makePopulateChain(value) {
  const obj = {};
  obj.populate = () => obj;
  obj.lean = () => Promise.resolve(value);
  return obj;
}

function makeQueryList(value) {
  return {
    populate: () => ({
      populate: () => ({
        populate: () => ({
          populate: () => ({
            sort: () => ({
              skip: () => ({
                limit: () => ({ lean: () => Promise.resolve(value) }),
              }),
            }),
          }),
        }),
      }),
    }),
  };
}

beforeEach(() => jest.clearAllMocks());

describe("prescription.controller", () => {
  describe("create", () => {
    test("missing appointmentId forwarded to next", async () => {
      const req = { body: {} };
      const next = jest.fn();
      mongoose.startSession = jest.fn().mockResolvedValue({ withTransaction: async (fn) => fn(), endSession: jest.fn() });
      await controller.create(req, {}, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].message).toMatch(/appointmentId is required/);
    });

    test("invalid appointmentId forwarded as ApiError", async () => {
      const req = { body: { appointmentId: "bad-id" } };
      const next = jest.fn();
      mongoose.startSession = jest.fn().mockResolvedValue({ withTransaction: async (fn) => fn(), endSession: jest.fn() });
      await controller.create(req, {}, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].message).toMatch(/Invalid appointmentId/);
    });

    test("appointment not found inside transaction returns error", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const req = { body: { appointmentId: id }, doctor: { _id: "d1" } };
      const next = jest.fn();
      mongoose.startSession = jest.fn().mockResolvedValue({ withTransaction: async (fn) => fn(), endSession: jest.fn() });
      Appointment.findById.mockReturnValueOnce({ session: () => Promise.resolve(null) });
      const res = createRes();
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].message).toMatch(/Appointment not found/);
    });

    test("happy path creates prescription and returns 201", async () => {
      const apptId = new mongoose.Types.ObjectId().toString();
      const appt = {
        _id: apptId,
        centerId: "c1",
        doctorId: "d1",
        userId: "u1",
        status: "booked",
        save: jest.fn().mockResolvedValue(true),
      };

      const req = { body: { appointmentId: apptId, items: [{ medicineName: "A" }] }, doctor: { _id: "d1" } };
      const res = createRes();
      const next = jest.fn();

      mongoose.startSession = jest.fn().mockResolvedValue({ withTransaction: async (fn) => fn(), endSession: jest.fn() });

      Appointment.findById.mockReturnValueOnce({ session: () => Promise.resolve(appt) });
      Prescription.findOne.mockReturnValueOnce({ session: () => ({ lean: () => Promise.resolve(null) }) });
      Counter.findOneAndUpdate.mockReturnValueOnce({ lean: () => Promise.resolve({ seq: 1 }) });
      Prescription.create.mockResolvedValueOnce([{ _id: "p1" }]);
      const createdDoc = { _id: "p1", prescriptionNo: "P0001" };
      Prescription.findById.mockReturnValueOnce(makePopulateChain(createdDoc));

      await controller.create(req, res, next);
      if (next.mock.calls.length) {
        // bubble up controller error for easier debugging
        throw next.mock.calls[0][0];
      }
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: createdDoc });
    });
  });

  describe("getById", () => {
    test("invalid id forwarded to next", async () => {
      const req = { params: { id: "bad" } };
      const next = jest.fn();
      await controller.getById(req, {}, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].message).toMatch(/Invalid prescription id/);
    });

    test("not found forwarded as 404", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const req = { params: { id } };
      const next = jest.fn();
      const res = createRes();
      Prescription.findById.mockImplementationOnce(() => makePopulateChain(null));
      await controller.getById(req, res, next);
      if (!next.mock.calls.length) {
        throw new Error(`expected next to be called but it was not; res.json calls: ${JSON.stringify(res.json.mock.calls)}`);
      }
      expect(next.mock.calls[0][0].message).toMatch(/Prescription not found/);
    });
  });

  describe("list", () => {
    test("invalid centerId returns error", async () => {
      const req = { query: { centerId: "bad" } };
      const next = jest.fn();
      await controller.list(req, {}, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].message).toMatch(/Invalid centerId/);
    });

    test("returns data and pagination", async () => {
      const doc = { _id: "p1" };
      Prescription.find.mockReturnValueOnce(makeQueryList([doc]));
      Prescription.countDocuments.mockResolvedValueOnce(1);
      const req = { query: {} };
      const res = createRes();
      await controller.list(req, res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [doc], pagination: expect.any(Object) }));
    });
  });

  describe("markDispensed", () => {
    test("invalid id forwarded", async () => {
      const req = { params: { id: "bad" }, body: {} };
      const next = jest.fn();
      const res = createRes();
      await controller.markDispensed(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].message).toMatch(/Invalid prescription id/);
    });

    test("not found forwarded as 404", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const req = { params: { id }, body: {} };
      const next = jest.fn();
      const res = createRes();
      Prescription.findByIdAndUpdate.mockReturnValueOnce(makePopulateChain(null));
      await controller.markDispensed(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].message).toMatch(/Prescription not found/);
    });

    test("successful markDispensed returns data", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const updated = { _id: id, status: "dispensed" };
      Prescription.findByIdAndUpdate.mockReturnValueOnce(makePopulateChain(updated));
      const req = { params: { id }, body: { dispensedBy: "pharmacy" } };
      const res = createRes();
      await controller.markDispensed(req, res, jest.fn());
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
    });
  });

  describe("downloadPdf", () => {
    test("invalid id forwarded", async () => {
      const req = { params: { id: "bad" } };
      const next = jest.fn();
      await controller.downloadPdf(req, {}, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].message).toMatch(/Invalid prescription id/);
    });

    test("not found forwarded", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const req = { params: { id }, user: { _id: "u1", role: "patient" } };
      const next = jest.fn();
      const res = createRes();
      Prescription.findById.mockReturnValueOnce(makePopulateChain(null));
      await controller.downloadPdf(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].message).toMatch(/Prescription not found/);
    });
  });
});
