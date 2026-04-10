jest.mock('../../models/pharmacy/medicationInventory');

const MedicationInventory = require('../../models/pharmacy/medicationInventory');

const {
  createMedication,
  getAllMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  addBatch,
  updateBatch,
  deleteBatch,
} = require('./medicationInventoryController');

describe('medicationInventoryController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createMedication()', () => {
    it('returns 201 on success', async () => {
      const req = { body: { name: 'X' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      MedicationInventory.create.mockResolvedValue({ _id: 'm1', name: 'X' });
      await createMedication(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ _id: 'm1', name: 'X' });
    });
  });

  describe('getAllMedications()', () => {
    it('returns list', async () => {
      const items = [{ _id: 'm1' }];
      MedicationInventory.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(items) });
      const req = { query: {} };
      const res = { json: jest.fn() };
      await getAllMedications(req, res);
      expect(res.json).toHaveBeenCalledWith(items);
    });
  });

  describe('getMedicationById()', () => {
    it('returns 404 when not found', async () => {
      MedicationInventory.findById.mockResolvedValue(null);
      const req = { params: { id: 'x' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getMedicationById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateMedication() and deleteMedication()', () => {
    it('updateMedication returns 404 when not found', async () => {
      MedicationInventory.findByIdAndUpdate.mockResolvedValue(null);
      const req = { params: { id: 'x' }, body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await updateMedication(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deleteMedication returns 404 when not found', async () => {
      MedicationInventory.findByIdAndDelete.mockResolvedValue(null);
      const req = { params: { id: 'x' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await deleteMedication(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('addBatch()', () => {
    it('returns 400 when required fields missing', async () => {
      const req = { params: { id: 'm1' }, body: { batchNo: '', expiryDate: '', quantity: undefined }, user: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await addBatch(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('adds new batch when med exists', async () => {
      const req = { params: { id: 'm1' }, body: { batchNo: 'B1', expiryDate: '2030-01-01', quantity: 5, unitPrice: 10 }, user: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const med = { _id: 'm1', batches: [], save: jest.fn().mockResolvedValue(true) };
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      MedicationInventory.findById.mockResolvedValue(med);
      // After save, controller calls findById again for updated doc
      MedicationInventory.findById.mockResolvedValue({ _id: 'm1', batches: [{ batchNo: 'B1', quantity: 5 }] });

      await addBatch(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('updateBatch and deleteBatch', () => {
    it('updateBatch returns 404 when med not found', async () => {
      MedicationInventory.findById.mockResolvedValue(null);
      const req = { params: { id: 'm1', batchId: 'b1' }, body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await updateBatch(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deleteBatch returns 404 when med not found', async () => {
      MedicationInventory.findById.mockResolvedValue(null);
      const req = { params: { id: 'm1', batchId: 'b1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await deleteBatch(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
