import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
// jest-dom matchers are provided via setupTests; no local import needed

// Mocks
jest.mock('react-router-dom', () => ({
  useParams: () => ({ bookingId: 'booking-1' }),
  useNavigate: () => jest.fn(),
}));

const mockApiFetch = jest.fn();
jest.mock('@/lib/api', () => ({ apiFetch: (...args) => mockApiFetch(...args) }));

jest.mock('@/lib/slotUtils', () => ({
  SLOT_STATUS_STYLES: { TEST: 'test-style' },
  SLOT_STATUS_LABEL: { TEST: 'Test status' },
  getSlotDisplayStatus: jest.fn(() => 'TEST'),
}));

// Import the component after mocking to ensure the mocks are applied
import BookingDetailPage from './BookingDetailPage';

const bookingSample = {
  _id: 'booking-1',
  appointmentStatus: 'CONFIRMED',
  appointmentDate: '2024-01-01T00:00:00.000Z',
  user: { name: 'Alice Doe', email: 'alice@example.com', phone: '12345' },
  healthCenter: { name: 'Health Center A', address: '123 Main St', phone: '555-000' },
  diagnosticTest: { name: 'Full Blood Count', description: 'Test desc', instructions: 'Fasting 8 hours' },
  slot: { slotDate: '2024-01-01T00:00:00.000Z', startTime: '09:00', endTime: '10:00', status: 'BOOKED' },
};

describe('BookingDetailPage', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  test('renders booking details after successful fetch', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: bookingSample });

    render(<BookingDetailPage />);

    // shows loading initially
    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();

    // await booking name to appear
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Full Blood Count'));

    // patient details
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Alice Doe')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();

    // slot status badge from mocked slotUtils
    expect(screen.getByText('Test status')).toBeInTheDocument();
  });

  test('cancel booking flow updates status and calls API', async () => {
    // First call: GET booking
    mockApiFetch.mockResolvedValueOnce({ data: bookingSample });
    // Second call: PUT updateappointment
    mockApiFetch.mockResolvedValueOnce({ success: true });

    render(<BookingDetailPage />);

    // wait for loaded
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Full Blood Count'));

    // Cancel Booking button (initial) should exist
    const cancelButtons = screen.getAllByText('Cancel Booking');
    expect(cancelButtons.length).toBeGreaterThan(0);

    // Click the page-level Cancel Booking to open dialog (first occurrence)
    fireEvent.click(cancelButtons[0]);

    // Dialog title appears
    expect(screen.getByText('Cancel this booking?')).toBeInTheDocument();

    // Click the dialog Cancel Booking action (second occurrence)
    const dialogActions = screen.getAllByText('Cancel Booking');
    fireEvent.click(dialogActions[dialogActions.length - 1]);

    // await the PUT to complete and UI to update to Cancelled
    await waitFor(() => expect(screen.getByText(/Cancelled/i)).toBeInTheDocument());

    // ensure apiFetch was called for PUT with expected path and body
    expect(mockApiFetch).toHaveBeenCalledWith('/updateappointment/booking-1', expect.objectContaining({ method: 'PUT' }));
  });

  test('shows "Booking not found" when API returns null', async () => {
    mockApiFetch.mockResolvedValueOnce(null);

    render(<BookingDetailPage />);

    await waitFor(() => expect(screen.getByText('Booking not found')).toBeInTheDocument());
  });

  test('displays error message when fetch fails', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network failure'));

    render(<BookingDetailPage />);

    await waitFor(() => expect(screen.getByText(/Network failure/)).toBeInTheDocument());
  });
});

