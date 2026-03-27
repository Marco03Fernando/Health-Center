// Use real mongoose but override startSession and ObjectId.isValid when needed
jest.mock('mongoose', () => {
  const real = jest.requireActual('mongoose');
  return {
    ...real,
    startSession: jest.fn(),
    Types: {
      ...real.Types,
      ObjectId: { ...real.Types.ObjectId, isValid: jest.fn() },
    },
  };
});

jest.mock('../../models/HealthCenter');
jest.mock('../../models/AppoinmentSlot');

const mongoose = require('mongoose');
const HealthCenter = require('../../models/HealthCenter');
const AppointmentSlot = require('../../models/AppoinmentSlot');

const controller = require('./appointmentSlotsController');

describe('appointmentSlotsController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
  });

  describe('helpers', () => {
    it('getSlotEndDateTime combines slotDate and endTime', () => {
      const slot = { slotDate: '2026-03-21T00:00:00.000Z', endTime: '14:30' };
      const d = controller.getSlotEndDateTime(slot);
      const expected = new Date(slot.slotDate);
      const [h, m] = slot.endTime.split(':').map(Number);
      expected.setHours(h, m, 0, 0);
      expect(d.getTime()).toBe(expected.getTime());
    });

    it('isSlotExpired returns true for past slot', () => {
      const past = new Date(Date.now() - 1000 * 60 * 60).toISOString();
      const slot = { slotDate: past, endTime: '00:00' };
      expect(controller.isSlotExpired(slot)).toBe(true);
    });
  });

  describe('generateAppointmentSlots', () => {
    it('returns 400 when healthCenterId missing', async () => {
      const req = { body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.generateAppointmentSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when startDateStr missing', async () => {
      const req = { body: { healthCenterId: 'h1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.generateAppointmentSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for invalid healthCenterId', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      const req = { body: { healthCenterId: 'bad', startDateStr: '2026-03-22' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.generateAppointmentSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when center not found', async () => {
      HealthCenter.findById.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue(null) }));
      const req = { body: { healthCenterId: 'h1', startDateStr: '2099-01-01' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.generateAppointmentSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when center has no opening/closing times', async () => {
      HealthCenter.findById.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue({ name: 'C' }) }));
      const req = { body: { healthCenterId: 'h1', startDateStr: '2099-01-01' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.generateAppointmentSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('creates slots and returns 201 on success', async () => {
      HealthCenter.findById.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue({ openingTime: '09:00', closingTime: '10:00', name: 'Center' }) }));
      AppointmentSlot.find.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue([]) }));
      AppointmentSlot.insertMany.mockResolvedValue([{ _id: 's1' }]);

      const req = { body: { healthCenterId: 'h1', startDateStr: '2099-01-01', numberOfDays: 1, slotMinutes: 30 } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await controller.generateAppointmentSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('updateAppointmentSlots', () => {
    it('returns 404 when slot not found', async () => {
      AppointmentSlot.findById.mockResolvedValue(null);
      const req = { params: { id: 'x' }, body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.updateAppointmentSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('updates slot and returns 200', async () => {
      const slot = { save: jest.fn().mockResolvedValue({ _id: 'x' }) };
      AppointmentSlot.findById.mockResolvedValue(slot);
      const req = { params: { id: 'x' }, body: { status: 'CANCELLED' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.updateAppointmentSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getAppointmentSlots', () => {
    it('returns 400 when center missing', async () => {
      const req = { query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.getAppointmentSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for invalid status', async () => {
      const req = { query: { center: 'c1', status: 'BAD' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.getAppointmentSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns slots on success', async () => {
      const slots = [{ _id: 'a' }];
      const findChain = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue(slots) };
      AppointmentSlot.find.mockReturnValue(findChain);
      const req = { query: { center: 'c1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.getAppointmentSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, count: slots.length, data: slots });
    });
  });

  describe('getAvailableAppointmentSlots', () => {
    it('returns future available slots only', async () => {
      const now = Date.now();
      const futureDate = new Date(now + 1000 * 60 * 60).toISOString();
      const pastDate = new Date(now - 1000 * 60 * 60).toISOString();
      // Choose times that clearly separate past and future when set with setHours
      const slots = [
        { _id: 'f', slotDate: futureDate, startTime: '23:59' },
        { _id: 'p', slotDate: pastDate, startTime: '00:00' },
      ];
      AppointmentSlot.find.mockResolvedValue(slots);
      const req = { params: { centerId: 'c1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.getAvailableAppointmentSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.availableSlots.some(s => s._id === 'f')).toBe(true);
      expect(body.availableSlots.some(s => s._id === 'p')).toBe(false);
    });
  });

  describe('getAppointmentSlotsByCenterId', () => {
    it('returns 400 when centerId invalid', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      const req = { params: { centerId: 'bad' }, query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.getAppointmentSlotsByCenterId(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('filters by type upcoming/expired correctly', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      const now = Date.now();
      const future = { _id: 'f', slotDate: new Date(now + 1000 * 60 * 60).toISOString(), endTime: '23:59', startTime: '01:00' };
      const past = { _id: 'p', slotDate: new Date(now - 1000 * 60 * 60).toISOString(), endTime: '00:00', startTime: '01:00' };
      const findChain = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([future, past]) };
      AppointmentSlot.find.mockReturnValue(findChain);

      const reqUpcoming = { params: { centerId: 'c1' }, query: { type: 'upcoming' } };
      const res1 = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.getAppointmentSlotsByCenterId(reqUpcoming, res1);
      expect(res1.status).toHaveBeenCalledWith(200);
      expect(res1.json.mock.calls[0][0].data.some(s => s._id === 'f')).toBe(true);

      const reqExpired = { params: { centerId: 'c1' }, query: { type: 'expired' } };
      const res2 = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.getAppointmentSlotsByCenterId(reqExpired, res2);
      expect(res2.status).toHaveBeenCalledWith(200);
      expect(res2.json.mock.calls[0][0].data.some(s => s._id === 'p')).toBe(true);
    });
  });

  describe('deleteAppointmentSlot', () => {
    it('returns 400 for invalid id', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      const req = { params: { id: 'bad' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.deleteAppointmentSlot(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when slot not found', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      AppointmentSlot.findById.mockResolvedValue(null);
      const req = { params: { id: 'x' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.deleteAppointmentSlot(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when slot is booked', async () => {
      AppointmentSlot.findById.mockResolvedValue({ status: 'BOOKED' });
      const req = { params: { id: 'x' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.deleteAppointmentSlot(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deletes slot successfully', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      AppointmentSlot.findById.mockResolvedValue({ status: 'AVAILABLE', slotDate: futureDate, startTime: '23:59' });
      AppointmentSlot.findByIdAndDelete.mockResolvedValue({});
      const req = { params: { id: 'x' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.deleteAppointmentSlot(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteExpiredUnbookedSlots', () => {
    it('returns 400 when centerId missing/invalid', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      const req = { query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.deleteExpiredUnbookedSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 200 with deletedCount 0 when no expired slots', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      AppointmentSlot.find.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue([]) }));
      const req = { query: { centerId: 'c1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.deleteExpiredUnbookedSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('deletes expired slots when present', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      const expired = [{ _id: 'e1', slotDate: new Date(0), endTime: '00:00' }];
      AppointmentSlot.find.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue(expired) }));
      AppointmentSlot.deleteMany.mockResolvedValue({ deletedCount: 1 });
      const req = { query: { centerId: 'c1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.deleteExpiredUnbookedSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('deleteUpcomingUnbookedSlots', () => {
    it('returns 400 for invalid centerId or missing date', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      let req = { query: {} };
      let res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.deleteUpcomingUnbookedSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(400);

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      req = { query: { centerId: 'c1' } };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.deleteUpcomingUnbookedSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 200 and handles candidate filtering', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      const now = Date.now();
      const candidates = [
        { _id: 'b', status: 'BOOKED', startTime: '01:00', endTime: '01:30' },
        { _id: 'p', status: 'AVAILABLE', startTime: '00:00', endTime: '00:30', slotDate: new Date(now - 1000 * 60 * 60).toISOString() },
        { _id: 'd', status: 'AVAILABLE', startTime: '23:59', endTime: '23:59', slotDate: new Date(now + 1000 * 60 * 60).toISOString() },
      ];
      AppointmentSlot.find.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue(candidates) }));
      AppointmentSlot.deleteMany.mockResolvedValue({ deletedCount: 1 });
      const req = { query: { centerId: 'c1', date: '2026-03-21' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.deleteUpcomingUnbookedSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
