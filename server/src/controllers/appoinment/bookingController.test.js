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

jest.mock('../../models/Appoinment');
jest.mock('../../models/AppoinmentSlot');
jest.mock('../../models/User');
jest.mock('../../models/HealthCenter');
jest.mock('../../utils/emailService', () => ({
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendBookingCancellationEmail: jest.fn().mockResolvedValue(undefined),
  sendBookingCompletedEmail: jest.fn().mockResolvedValue(undefined),
}));

const mongoose = require('mongoose');
const AppointmentSlot = require('../../models/AppoinmentSlot');
const Booking = require('../../models/Appoinment');
const User = require('../../models/User');
const HealthCenter = require('../../models/HealthCenter');
const emailService = require('../../utils/emailService');

const {
  bookAppointment,
  updateAppointment,
  deleteAppointment,
  getCenterAppointments,
  getAllAppointmentsAdmin,
  getAppointmentById,
  getUserAppointments,
} = require('./bookingController');

describe('bookingController', () => {
  let fakeSession;

  beforeEach(() => {
    jest.resetAllMocks();
    fakeSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
      session: jest.fn(),
      inAtomicalTransaction: jest.fn().mockReturnValue(false),
    };
    mongoose.startSession.mockReturnValue(fakeSession);
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    // Ensure mocked email functions return promises (resetAllMocks clears mockResolvedValue)
    if (emailService && emailService.sendBookingConfirmationEmail) {
      emailService.sendBookingConfirmationEmail.mockResolvedValue(undefined);
    }
    if (emailService && emailService.sendBookingCancellationEmail) {
      emailService.sendBookingCancellationEmail.mockResolvedValue(undefined);
    }
    if (emailService && emailService.sendBookingCompletedEmail) {
      emailService.sendBookingCompletedEmail.mockResolvedValue(undefined);
    }
  });

  describe('bookAppointment', () => {
    it('returns 400 when slotId or userId missing', async () => {
      const req = { body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await bookAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when slot not found', async () => {
      AppointmentSlot.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(null) }));
      const req = { body: { slotId: 's1', userId: 'u1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await bookAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when slot not available', async () => {
      AppointmentSlot.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue({ status: 'BOOKED' }) }));
      const req = { body: { slotId: 's1', userId: 'u1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await bookAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when cutoff time passed', async () => {
      const now = new Date();
      const slotDate = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      AppointmentSlot.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue({ status: 'AVAILABLE', slotDate, startTime: `${now.getUTCHours()}:${now.getUTCMinutes()}` }) }));
      const req = { body: { slotId: 's1', userId: 'u1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await bookAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('creates booking and returns 201 on success', async () => {
      const future = new Date(Date.now() + 1000 * 60 * 60);
      const startH = future.getHours();
      const startM = future.getMinutes();
      const startTimeStr = `${startH}:${startM}`;
      const slot = { _id: 's1', status: 'AVAILABLE', slotDate: future.toISOString(), startTime: startTimeStr, center: 'c1', save: jest.fn().mockResolvedValue(true) };
      AppointmentSlot.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(slot) }));

      const savedBooking = { _id: 'b1' };
      Booking.mockImplementation(() => ({ save: jest.fn().mockResolvedValue(savedBooking) }));

      User.findById.mockResolvedValue({ email: 'u@e.com' });
      HealthCenter.findById.mockResolvedValue({ name: 'Center' });

      const req = { body: { slotId: 's1', userId: 'u1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await bookAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Booking confirmed', booking: savedBooking });
      expect(emailService.sendBookingConfirmationEmail).toHaveBeenCalled();
    });
  });

  describe('updateAppointment', () => {
    it('returns 404 when booking not found', async () => {
      Booking.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(null) }));
      const req = { params: { bookingId: 'b1' }, body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await updateAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('updates diagnosticTest and returns 200', async () => {
      const booking = { appointmentStatus: 'PENDING', save: jest.fn().mockResolvedValue(true) };
      Booking.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(booking) }));
      const req = { params: { bookingId: 'b1' }, body: { diagnosticTestId: 't1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await updateAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('cancels booking and sends cancellation email', async () => {
      const booking = { appointmentStatus: 'CONFIRMED', user: 'u1', healthCenter: 'c1', slot: 's1', save: jest.fn().mockResolvedValue(true) };
      Booking.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(booking) }));
      AppointmentSlot.findByIdAndUpdate.mockResolvedValue({});
      User.findById.mockResolvedValue({ email: 'u@e.com' });
      HealthCenter.findById.mockResolvedValue({ name: 'Center' });

      const req = { params: { bookingId: 'b1' }, body: { status: 'CANCELLED' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await updateAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(emailService.sendBookingCancellationEmail).toHaveBeenCalled();
    });
  });

  describe('deleteAppointment', () => {
    it('returns 404 when booking not found', async () => {
      Booking.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(null) }));
      const req = { params: { bookingId: 'b1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await deleteAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deletes booking and frees slot', async () => {
      const booking = { slot: 's1' };
      Booking.findById.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(booking) }));
      AppointmentSlot.findByIdAndUpdate.mockImplementation(() => ({ session: jest.fn().mockResolvedValue({}) }));
      Booking.findByIdAndDelete.mockImplementation(() => ({ session: jest.fn().mockResolvedValue(true) }));
      const req = { params: { bookingId: 'b1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await deleteAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getCenterAppointments & admin/all', () => {
    it('getCenterAppointments returns list', async () => {
      const items = [{ _id: 'a' }];
      const chain = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue(items) };
      Booking.find.mockReturnValue(chain);
      const req = { params: { centerId: 'c1' }, query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getCenterAppointments(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, count: items.length, data: items });
    });

    it('getAllAppointmentsAdmin returns list', async () => {
      const items = [{ _id: 'b' }];
      const chain = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue(items) };
      Booking.find.mockReturnValue(chain);
      const req = { query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getAllAppointmentsAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, count: items.length, data: items });
    });

    it('getAllAppointmentsAdmin filters by date when provided', async () => {
      const items = [{ _id: 'd' }];
      const chain = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue(items) };
      let capturedFilter;
      Booking.find.mockImplementation((filter) => { capturedFilter = filter; return chain; });
      const req = { query: { date: '2026-03-21' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getAllAppointmentsAdmin(req, res);

      expect(Booking.find).toHaveBeenCalled();
      expect(capturedFilter).toHaveProperty('appointmentDate');
      const gte = capturedFilter.appointmentDate.$gte;
      const lte = capturedFilter.appointmentDate.$lte;
      expect(gte).toBeInstanceOf(Date);
      expect(lte).toBeInstanceOf(Date);
      const start = new Date('2026-03-21'); start.setHours(0,0,0,0);
      const end = new Date('2026-03-21'); end.setHours(23,59,59,999);
      expect(gte.getTime()).toBe(start.getTime());
      expect(lte.getTime()).toBe(end.getTime());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, count: items.length, data: items });
    });

    it('getAllAppointmentsAdmin filters by centerId and testId when provided', async () => {
      const items = [{ _id: 'c' }];
      const chain = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue(items) };
      let capturedFilter;
      Booking.find.mockImplementation((filter) => { capturedFilter = filter; return chain; });
      const req = { query: { centerId: 'center123', testId: 'test456' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getAllAppointmentsAdmin(req, res);

      expect(Booking.find).toHaveBeenCalled();
      expect(capturedFilter.healthCenter).toBe('center123');
      expect(capturedFilter.diagnosticTest).toBe('test456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, count: items.length, data: items });
    });
  });

  describe('getAppointmentById', () => {
    it('returns 400 when bookingId missing', async () => {
      const req = { params: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getAppointmentById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when invalid id', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      const req = { params: { bookingId: 'bad' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getAppointmentById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when not found', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Booking.findById.mockReturnValue({
        populate: jest.fn()
          .mockReturnValue({
            populate: jest.fn()
              .mockReturnValue({
                populate: jest.fn()
                  .mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null)
                  })
              })
          })
      });
      const req = { params: { bookingId: 'b1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getAppointmentById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with booking when found', async () => {
      Booking.findById.mockReturnValue({
        populate: jest.fn()
          .mockReturnValue({
            populate: jest.fn()
              .mockReturnValue({
                populate: jest.fn()
                  .mockReturnValue({
                    populate: jest.fn().mockResolvedValue({ _id: 'b1' })
                  })
              })
          })
      });
      const req = { params: { bookingId: 'b1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getAppointmentById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: 'b1' } });
    });
  });

  describe('getUserAppointments', () => {
    it('returns 400 when userId missing', async () => {
      const req = { params: {}, query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getUserAppointments(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when invalid userId', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      const req = { params: { userId: 'bad' }, query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getUserAppointments(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for invalid status', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      const req = { params: { userId: 'u1' }, query: { status: 'WRONG' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getUserAppointments(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns appointments on success', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      const items = [{ _id: 'a' }];
      const chain = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue(items) };
      Booking.find.mockReturnValue(chain);
      const req = { params: { userId: 'u1' }, query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getUserAppointments(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, count: items.length, data: items });
    });
  });
});
