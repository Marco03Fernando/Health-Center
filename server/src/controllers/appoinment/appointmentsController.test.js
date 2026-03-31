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

jest.mock('../../models/doctorChanneling/appointment.model');
jest.mock('../../models/doctorChanneling/slot.model');
jest.mock('../../models/doctorChanneling/doctor.model');

const mongoose = require('mongoose');
const Appointment = require('../../models/doctorChanneling/appointment.model');
const Slot = require('../../models/doctorChanneling/slot.model');
const Doctor = require('../../models/doctorChanneling/doctor.model');

const {
  create,
  listByUser,
  cancel,
  pay,
} = require('./appointmentsController');

describe('appointmentsController', () => {
  let fakeSession;

  beforeEach(() => {
    jest.resetAllMocks();

    fakeSession = {
      withTransaction: async (cb) => {
        await cb();
      },
      endSession: jest.fn(),
      startTransaction: jest.fn(),
      abortTransaction: jest.fn(),
    };

    mongoose.startSession.mockReturnValue(fakeSession);
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
  });

  describe('create()', () => {
    it('calls next when required fields are missing', async () => {
      const req = { body: {} };
      const res = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();
      await create(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('returns 201 and created appointment on success', async () => {
      const req = { body: { centerId: 'c1', doctorId: 'd1', slotId: 's1', userId: 'u1', note: 'n' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const doctor = { centerId: 'c1', isActive: true, fee: 500 };
      Doctor.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(doctor) }));

      Slot.findOneAndUpdate.mockResolvedValue({ _id: 's1' });

      Appointment.create.mockResolvedValue([{ _id: 'a1' }]);
      Appointment.findOne.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue({ _id: 'a1', slotId: 's1' }) }));

      await create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: 'a1', slotId: 's1' } });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('listByUser()', () => {
    it('calls next when userId invalid', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      const req = { params: { userId: 'invalid' } };
      const res = { json: jest.fn() };
      const next = jest.fn();
      await listByUser(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('returns list on success', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      const items = [{ _id: 'x' }];
      const findChain = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue(items) };
      Appointment.find.mockReturnValue(findChain);

      const req = { params: { userId: 'u1' } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await listByUser(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: items });
    });
  });

  describe('cancel()', () => {
    it('returns 400 if userId missing in query', async () => {
      const req = { query: {}, params: { id: 'a' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await cancel(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'userId is required in query' });
    });

    it('calls next when userId invalid', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      const req = { query: { userId: 'bad' }, params: { id: 'a' } };
      const res = {};
      const next = jest.fn();
      await cancel(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('calls next when appointment not found', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Appointment.findOne.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(null) }));
      const req = { query: { userId: 'u1' }, params: { id: 'a' } };
      const res = {};
      const next = jest.fn();
      await cancel(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('cancels appointment successfully', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      const appt = {
        _id: 'a',
        status: 'CONFIRMED',
        slotId: 's1',
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findOne.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(appt) }));
      Slot.updateOne.mockResolvedValue({});
      Appointment.findById.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue({ _id: 'a', status: 'CANCELLED' }) }));

      const req = { query: { userId: 'u1' }, params: { id: 'a' } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await cancel(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: 'a', status: 'CANCELLED' } });
    });
  });

  describe('pay()', () => {
    it('calls next when appointment not found', async () => {
      Appointment.findById.mockResolvedValue(null);
      const req = { params: { id: 'a' }, body: {} };
      const res = {};
      const next = jest.fn();
      await pay(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('returns error when appointment already paid', async () => {
      const appt = { payment: { status: 'paid' } };
      Appointment.findById.mockResolvedValue(appt);
      const req = { params: { id: 'a' }, body: {} };
      const res = {};
      const next = jest.fn();
      await pay(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('marks appointment as paid and returns it', async () => {
      const appt = {
        _id: 'a',
        status: 'PENDING',
        payment: { status: 'unpaid', method: 'cash' },
        save: jest.fn().mockResolvedValue(true),
      };
      Appointment.findById.mockResolvedValue(appt);

      const req = { params: { id: 'a' }, body: { method: 'card' } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await pay(req, res, next);

      expect(appt.payment.status).toBe('paid');
      expect(appt.payment.method).toBe('card');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: appt });
    });
  });
});

