// Mock mongoose and models before requiring the controller
jest.mock('mongoose', () => {
  const realMongoose = jest.requireActual('mongoose');
  return {
    ...realMongoose,
    startSession: jest.fn(),
    Types: {
      ...realMongoose.Types,
      ObjectId: { ...realMongoose.Types.ObjectId, isValid: jest.fn() },
    },
  };
});

jest.mock('../../models/pharmacy/pharmacyOrder');
jest.mock('../../models/pharmacy/medicationInventory');
jest.mock('../../models/doctorChanneling/prescription.model');
jest.mock('../../utils/sendInvoiceEmail');

const mongoose = require('mongoose');
const PharmacyOrder = require('../../models/pharmacy/pharmacyOrder');
const MedicationInventory = require('../../models/pharmacy/medicationInventory');
const Prescription = require('../../models/doctorChanneling/prescription.model');
const sendInvoiceEmail = require('../../utils/sendInvoiceEmail');

const {
  createOrder,
  createOrderFromPrescription,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderItems,
} = require('./pharmacyOrderController');

describe('pharmacyOrderController', () => {
  let fakeSession;

  beforeEach(() => {
    jest.resetAllMocks();

    fakeSession = {
      withTransaction: async (cb) => { await cb(); },
      endSession: jest.fn(),
      startTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      commitTransaction: jest.fn(),
    };

    mongoose.startSession.mockReturnValue(fakeSession);
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
  });

  describe('createOrder()', () => {
    it('returns 400 when required patient fields missing', async () => {
      const req = { body: { items: [], prescriptionTextSnapshot: 'p' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when medication not found while building plan', async () => {
      const req = { body: { patient: { name: 'A', email: 'a@a', phone: '1' }, prescriptionTextSnapshot: 'p', items: [{ medicationId: 'm1', qty: 1 }] } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      MedicationInventory.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(null) }));

      await createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('creates WAITING_STOCK order when shortage exists', async () => {
      const req = { body: { patient: { name: 'A', email: 'a@a', phone: '1' }, prescriptionTextSnapshot: 'p', items: [{ medicationId: 'm1', qty: 10 }] } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      const med = { _id: 'm1', name: 'Med', strength: '10mg', batches: [{ _id: 'b1', quantity: 2, unitPrice: 5, batchNo: 'BN1', expiryDate: '2030-01-01' }] };
      MedicationInventory.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(med) }));

      PharmacyOrder.create.mockResolvedValue([{ _id: 'o1', status: 'WAITING_STOCK' }]);

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(sendInvoiceEmail).toHaveBeenCalled();
    });

    it('creates CONFIRMED order when all items available', async () => {
      const req = { body: { patient: { name: 'A', email: 'a@a', phone: '1' }, prescriptionTextSnapshot: 'p', items: [{ medicationId: 'm1', qty: 2 }] } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      const med = { _id: 'm1', name: 'Med', strength: '10mg', batches: [{ _id: 'b1', quantity: 5, unitPrice: 5, batchNo: 'BN1', expiryDate: '2030-01-01' }], save: jest.fn().mockResolvedValue(true) };
      MedicationInventory.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(med) }));

      PharmacyOrder.create.mockResolvedValue([{ _id: 'o2', status: 'CONFIRMED' }]);

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(PharmacyOrder.create).toHaveBeenCalled();
      expect(sendInvoiceEmail).toHaveBeenCalled();
    });
  });

  describe('createOrderFromPrescription()', () => {
    it('returns 400 when prescriptionId invalid', async () => {
      const req = { body: { prescriptionId: 'bad' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      await createOrderFromPrescription(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when prescription not found', async () => {
      const req = { body: { prescriptionId: 'p1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      Prescription.findById.mockResolvedValue(null);
      await createOrderFromPrescription(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('creates WAITING_STOCK order from prescription', async () => {
      const req = { body: { prescriptionId: 'p1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const p = { _id: 'p1', prescriptionNo: 'PR-1', items: [{ medicineName: 'X', quantity: 1 }], userId: { fullName: 'U', email: 'u@u', phone: '1' }, doctorId: { name: 'D' } };
      Prescription.findById.mockResolvedValue(p);
      PharmacyOrder.create.mockResolvedValue({ _id: 'o3' });

      await createOrderFromPrescription(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(PharmacyOrder.create).toHaveBeenCalled();
      expect(sendInvoiceEmail).toHaveBeenCalled();
    });
  });

  describe('getOrders and getOrderById and updateOrder', () => {
    it('getOrders returns list', async () => {
      const items = [{ _id: 'o1' }];
      PharmacyOrder.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(items) });
      const req = {};
      const res = { json: jest.fn() };
      await getOrders(req, res);
      expect(res.json).toHaveBeenCalledWith(items);
    });

    it('getOrderById returns 404 when not found', async () => {
      PharmacyOrder.findById.mockResolvedValue(null);
      const req = { params: { id: 'x' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getOrderById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('updateOrder returns 404 when not found', async () => {
      PharmacyOrder.findByIdAndUpdate.mockResolvedValue(null);
      const req = { params: { id: 'x' }, body: { status: 'PENDING' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await updateOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateOrderItems()', () => {
    it('returns 400 when items array missing', async () => {
      const req = { params: { id: 'o1' }, body: { items: [] } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await updateOrderItems(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
