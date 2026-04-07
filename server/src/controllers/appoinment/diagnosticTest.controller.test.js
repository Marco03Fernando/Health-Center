const DiagnosticTest = require('../../models/DiagnosticTest');
jest.mock('../../models/DiagnosticTest');

const { getAllTests, getTestById, createTest } = require('./diagnosticTest.controller');
const { updateTest, deleteTest } = require('./diagnosticTest.controller');

describe('DiagnosticTest controller', () => {
  beforeEach(() => jest.resetAllMocks());

  it('getTestById calls next when not found', async () => {
    DiagnosticTest.findById.mockResolvedValue(null);
    const req = { params: { id: '1' } };
    const next = jest.fn();
    await getTestById(req, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('createTest returns 201 on success', async () => {
    DiagnosticTest.create.mockResolvedValue({ _id: '2', name: 'B' });
    const req = { body: { name: 'B', instructions: 'prep' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await createTest(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: '2', name: 'B' } });
  });

  it('createTest calls next when missing required fields', async () => {
    const req = { body: { name: 'X' } }; // missing instructions
    const next = jest.fn();
    await createTest(req, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('getTestById returns data when found', async () => {
    DiagnosticTest.findById.mockResolvedValue({ _id: '1', name: 'A' });
    const req = { params: { id: '1' } };
    const res = { json: jest.fn() };
    await getTestById(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: '1', name: 'A' } });
  });

  it('updateTest returns 404 via next if not found', async () => {
    DiagnosticTest.findByIdAndUpdate.mockResolvedValue(null);
    const req = { params: { id: 'x' }, body: { name: 'Z' } };
    const next = jest.fn();
    await updateTest(req, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('updateTest returns updated object on success', async () => {
    DiagnosticTest.findByIdAndUpdate.mockResolvedValue({ _id: 'u1', name: 'Updated' });
    const req = { params: { id: 'u1' }, body: { name: 'Updated' } };
    const res = { json: jest.fn() };
    await updateTest(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: 'u1', name: 'Updated' } });
  });

  it('deleteTest returns 404 via next if not found', async () => {
    DiagnosticTest.findByIdAndUpdate.mockResolvedValue(null);
    const req = { params: { id: 'd-not' } };
    const next = jest.fn();
    await deleteTest(req, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('deleteTest returns success message on success', async () => {
    DiagnosticTest.findByIdAndUpdate.mockResolvedValue({ _id: 'd1' });
    const req = { params: { id: 'd1' } };
    const res = { json: jest.fn() };
    await deleteTest(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Diagnostic test deleted successfully' });
  });
});
