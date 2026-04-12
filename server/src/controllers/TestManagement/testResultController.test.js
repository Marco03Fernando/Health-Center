const mongoose = require("mongoose");

jest.mock("pdfkit", () => {
  return class MockPDFDocument {
    constructor() {
      this._calls = [];
      this.pages = 1;
    }
    pipe(res) { this._calls.push(["pipe", res]); return this; }
    rect() { this._calls.push(["rect"]); return this; }
    fill() { this._calls.push(["fill"]); return this; }
    font() { this._calls.push(["font"]); return this; }
    fontSize() { this._calls.push(["fontSize"]); return this; }
    fillColor() { this._calls.push(["fillColor"]); return this; }
    text() { this._calls.push(["text", Array.from(arguments)]); return this; }
    moveTo() { this._calls.push(["moveTo"]); return this; }
    lineTo() { this._calls.push(["lineTo"]); return this; }
    lineWidth() { this._calls.push(["lineWidth"]); return this; }
    strokeColor() { this._calls.push(["strokeColor"]); return this; }
    stroke() { this._calls.push(["stroke"]); return this; }
    addPage() { this.pages += 1; this._calls.push(["addPage"]); return this; }
    save() { this._calls.push(["save"]); return this; }
    restore() { this._calls.push(["restore"]); return this; }
    roundedRect() { this._calls.push(["roundedRect", Array.from(arguments)]); return this; }
    fillAndStroke() { this._calls.push(["fillAndStroke"]); return this; }
    widthOfString(text, opts) { return (text || "").length * 6; }
    end() { this._calls.push(["end"]); return this; }
  };
});

jest.mock("../../models/TestManagement/TestResult", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock("../../models/Appoinment", () => ({
  find: jest.fn(),
}));

jest.mock("../../utils/testResultNotification", () => ({
  notifyTestResultCreated: jest.fn(),
  buildResultNotificationContent: jest.fn(),
}));

const TestResult = require("../../models/TestManagement/TestResult");
const Booking = require("../../models/Appoinment");
const { notifyTestResultCreated, buildResultNotificationContent } = require("../../utils/testResultNotification");

const controller = require("./testResultController");

function createRes() {
  const headers = {};
  return {
    status: jest.fn().mockImplementation(function (s) { this._status = s; return this; }),
    json: jest.fn().mockImplementation(function (j) { this._json = j; return this; }),
    setHeader: jest.fn((k, v) => { headers[k] = v; }),
    _headers: headers,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  if (console.error && console.error.mockRestore) console.error.mockRestore();
});

describe("TestResult Controller", () => {
  describe("createTestResult", () => {
    test("creates a test result and returns populated data", async () => {
      const req = { body: { foo: "bar" } };

      const created = { _id: "created-id" };
      TestResult.create.mockResolvedValue(created);

      const populated = { _id: "created-id", patientId: { name: "p" } };

      TestResult.findById.mockReturnValueOnce({
        populate: () => ({
          populate: () => ({
            populate: () => Promise.resolve(populated),
          }),
        }),
      });

      notifyTestResultCreated.mockResolvedValue({});

      const res = createRes();
      await controller.createTestResult(req, res);

      expect(TestResult.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res._json.success).toBe(true);
      expect(res._json.data).toBe(populated);
    });

    test("handles create error", async () => {
      const req = { body: {} };
      TestResult.create.mockRejectedValueOnce(new Error("bad"));
      const res = createRes();
      await controller.createTestResult(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res._json.success).toBe(false);
      expect(res._json.error).toBe("bad");
    });

    test("returns 404 when populated result missing", async () => {
      const req = { body: {} };
      TestResult.create.mockResolvedValue({ _id: "x" });
      TestResult.findById.mockReturnValueOnce({
        populate: () => ({ populate: () => ({ populate: () => Promise.resolve(null) }) }),
      });
      const res = createRes();
      await controller.createTestResult(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res._json.success).toBe(false);
    });
  });

  describe("sendTestResultWhatsApp", () => {
    test("returns 404 when not found", async () => {
      const req = { params: { id: "1" } };
      TestResult.findById.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(null) }) }) });
      const res = createRes();
      await controller.sendTestResultWhatsApp(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns 400 when no patient phone", async () => {
      const req = { params: { id: "1" } };
      const result = { patientId: {} };
      TestResult.findById.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(result) }) }) });
      buildResultNotificationContent.mockReturnValue({});
      const res = createRes();
      await controller.sendTestResultWhatsApp(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("sends whatsapp successfully", async () => {
      const req = { params: { id: "1" } };
      const result = { patientId: { phone: "+123" } };
      TestResult.findById.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(result) }) }) });
      buildResultNotificationContent.mockReturnValue({ patientPhone: "+123" });
      notifyTestResultCreated.mockResolvedValue({ whatsapp: { success: true, sid: "sid-1", status: "sent" } });
      const res = createRes();
      await controller.sendTestResultWhatsApp(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res._json.whatsappSid).toBe("sid-1");
    });

    test("returns 500 on whatsapp failure", async () => {
      const req = { params: { id: "1" } };
      const result = { patientId: { phone: "+123" } };
      TestResult.findById.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(result) }) }) });
      buildResultNotificationContent.mockReturnValue({ patientPhone: "+123" });
      notifyTestResultCreated.mockResolvedValue({ whatsapp: { success: false, error: "err" } });
      const res = createRes();
      await controller.sendTestResultWhatsApp(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("sendTestResultEmail", () => {
    test("returns 404 when not found", async () => {
      const req = { params: { id: "1" } };
      TestResult.findById.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(null) }) }) });
      const res = createRes();
      await controller.sendTestResultEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns 400 when no patient email", async () => {
      const req = { params: { id: "1" } };
      const result = { patientId: {} };
      TestResult.findById.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(result) }) }) });
      buildResultNotificationContent.mockReturnValue({});
      const res = createRes();
      await controller.sendTestResultEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("sends email successfully", async () => {
      const req = { params: { id: "1" } };
      const result = { patientId: { email: "a@b.com" } };
      TestResult.findById.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(result) }) }) });
      buildResultNotificationContent.mockReturnValue({ patientEmail: "a@b.com" });
      notifyTestResultCreated.mockResolvedValue({ email: { success: true, messageId: "m1" } });
      const res = createRes();
      await controller.sendTestResultEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res._json.emailMessageId).toBe("m1");
    });

    test("returns 500 on email failure", async () => {
      const req = { params: { id: "1" } };
      const result = { patientId: { email: "a@b.com" } };
      TestResult.findById.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(result) }) }) });
      buildResultNotificationContent.mockReturnValue({ patientEmail: "a@b.com" });
      notifyTestResultCreated.mockResolvedValue({ email: { success: false, error: "err" } });
      const res = createRes();
      await controller.sendTestResultEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getAllTestResults", () => {
    test("returns all results without centerId", async () => {
      TestResult.find.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve([1,2,3]) }) }) });
      const req = { query: {} };
      const res = createRes();
      await controller.getAllTestResults(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res._json.data.length).toBe(3);
    });

    test("filters by centerId", async () => {
      Booking.find.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([{ _id: "a" }, { _id: "b" }]) });
      TestResult.find.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve([]) }) }) });
      const req = { query: { centerId: "center1" } };
      const res = createRes();
      await controller.getAllTestResults(req, res);
      expect(Booking.find).toHaveBeenCalledWith({ healthCenter: "center1" }, "_id");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getTestResultById", () => {
    test("returns 404 when not found", async () => {
      TestResult.findById.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(null) }) }) });
      const req = { params: { id: "1" } };
      const res = createRes();
      await controller.getTestResultById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns result when found", async () => {
      const result = { _id: "x" };
      TestResult.findById.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(result) }) }) });
      const req = { params: { id: "x" } };
      const res = createRes();
      await controller.getTestResultById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res._json.data).toBe(result);
    });
  });

  describe("getTestResultsByPatientId", () => {
    test("returns 400 for invalid id", async () => {
      const req = { params: { patientId: "notvalid" } };
      const res = createRes();
      await controller.getTestResultsByPatientId(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("returns results for valid id", async () => {
      const pid = new mongoose.Types.ObjectId().toString();
      TestResult.find.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(["r"]) }) }) });
      const req = { params: { patientId: pid } };
      const res = createRes();
      await controller.getTestResultsByPatientId(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res._json.data).toEqual(["r"]);
    });
  });

  describe("updateTestResult", () => {
    test("returns 404 when not found", async () => {
      TestResult.findByIdAndUpdate.mockResolvedValueOnce(null);
      const req = { params: { id: "1" }, body: {} };
      const res = createRes();
      await controller.updateTestResult(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("updates and returns result", async () => {
      const updated = { _id: "u" };
      TestResult.findByIdAndUpdate.mockResolvedValueOnce(updated);
      const req = { params: { id: "u" }, body: { a: 1 } };
      const res = createRes();
      await controller.updateTestResult(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res._json.data).toBe(updated);
    });
  });

  describe("deleteTestResult", () => {
    test("returns 404 when not found", async () => {
      TestResult.findByIdAndDelete.mockResolvedValueOnce(null);
      const req = { params: { id: "1" } };
      const res = createRes();
      await controller.deleteTestResult(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("deletes and returns success", async () => {
      TestResult.findByIdAndDelete.mockResolvedValueOnce({ _id: "d" });
      const req = { params: { id: "d" } };
      const res = createRes();
      await controller.deleteTestResult(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res._json.success).toBe(true);
    });
  });

  describe("generateTestResultPdf", () => {
    test("returns 404 when result not found", async () => {
      TestResult.findById.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(null) }) }) });
      const req = { params: { id: "1" } };
      const res = createRes();
      await controller.generateTestResultPdf(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("generates pdf when result exists", async () => {
      const result = {
        _id: "x",
        patientId: { fullName: "John", phone: "+1", email: "a@b.com" },
        appointmentId: { _id: "a", appointmentDate: new Date(), user: {}, slot: {}, diagnosticTest: {}, healthCenter: { name: "C", address: "A", district: "D" } },
        testTypeId: { name: "T", testCode: "TC", sampleTypes: "blood", description: "desc" },
        condition: "Good",
        recommendConsultation: false,
        status: "Complete",
        results: [ { name: "p", value: 5, unit: "u", normalMinValue: 1, normalMaxValue: 10 } ],
      };

      TestResult.findById.mockReturnValueOnce({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve(result) }) }) });
      const req = { params: { id: "x" } };
      const res = createRes();
      await controller.generateTestResultPdf(req, res);
      expect(res.setHeader).toHaveBeenCalled();
      expect(res._headers["Content-Type"]).toBe("application/pdf");
    });
  });
});
