import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mocks
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

const mockApiFetch = jest.fn();
jest.mock('@/lib/api', () => ({ apiFetch: (...args) => mockApiFetch(...args) }));

// Keep real slotUtils so labels are predictable; tests use concrete times to control expiry

// Mock center admin context
jest.mock('@/contexts/CenterAdminContext', () => ({
  useCenterAdmin: jest.fn(),
}));

import SlotManagementPage from './SlotManagementPage';
const { useCenterAdmin } = require('@/contexts/CenterAdminContext');

describe('SlotManagementPage', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  test('shows empty state when no centerId', async () => {
    useCenterAdmin.mockReturnValue({ centerId: null });

    render(<SlotManagementPage />);
    // Then shows empty state
    await waitFor(() => expect(screen.getByText(/No slots for this view/i)).toBeInTheDocument());
  });

  test('generate slots flow shows success and renders generated slot', async () => {
    useCenterAdmin.mockReturnValue({ centerId: 'c1' });

    // Mount: initial fetchSlots -> return empty
    mockApiFetch.mockResolvedValueOnce({ slots: [] });
    // center hours fetch
    mockApiFetch.mockResolvedValueOnce({ data: [{ _id: 'c1', openingTime: '08:00', closingTime: '17:00' }] });
    // generateSlots POST
    mockApiFetch.mockResolvedValueOnce({ success: true });
    // fetchSlots after generate -> return one slot (today)
    const today = new Date();
    const slotDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())).toISOString();
    const slot = {
      _id: 's1',
      slotDate,
      startTime: '09:00',
      endTime: '09:30',
      status: 'AVAILABLE',
    };
    mockApiFetch.mockResolvedValueOnce({ slots: [slot] });

    render(<SlotManagementPage />);

    // Wait for generate button to be present
    const genButton = await screen.findByText(/Generate Slots/i);
    expect(genButton).toBeInTheDocument();

    // Submit the generate form
    fireEvent.click(genButton);

    // Wait for success message
    await waitFor(() => expect(screen.getByText(/Slots generated successfully/i)).toBeInTheDocument());

    // The date group header should show the formatted date; find and expand it
    const dateKey = new Date(slotDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const header = await screen.findByText(dateKey);
    fireEvent.click(header);

    // Slot time should be visible
    expect(await screen.findByText(/09:00/)).toBeInTheDocument();
  });

  test('cancel slot flow updates slot to Cancelled', async () => {
    useCenterAdmin.mockReturnValue({ centerId: 'c2' });

    // initial fetchSlots returns one available slot
    const today = new Date();
    const slotDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())).toISOString();
    const slot = { _id: 's2', slotDate, startTime: '10:00', endTime: '23:59', status: 'AVAILABLE', appoinment: null };
    mockApiFetch.mockResolvedValueOnce({ slots: [slot] });
    // center hours fetch
    mockApiFetch.mockResolvedValueOnce({ data: [{ _id: 'c2' }] });
    // No further fetches yet

    render(<SlotManagementPage />);

    // Expand date group
    const dateKey = new Date(slotDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const header = await screen.findByText(dateKey);
    fireEvent.click(header);

    // Click the Cancel Slot button (title="Cancel Slot")
    const cancelButtons = await screen.findAllByTitle('Cancel Slot');
    expect(cancelButtons.length).toBeGreaterThan(0);
    fireEvent.click(cancelButtons[0]);

    // Dialog opens; click the dialog action 'Cancel Slot'
    const dialogActions = await screen.findAllByText('Cancel Slot');

    // Mock updateSlot PUT response
    mockApiFetch.mockResolvedValueOnce({ success: true });

    fireEvent.click(dialogActions[dialogActions.length - 1]);

    // After update, badge should show 'Cancelled'
    await waitFor(() => expect(screen.getAllByText(/Cancelled/i).length).toBeGreaterThanOrEqual(1));
  });

  test('delete all expired flow calls delete API and shows success', async () => {
    useCenterAdmin.mockReturnValue({ centerId: 'c3' });

    // create an expired slot (yesterday)
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const slotDate = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate())).toISOString();
    const slot = { _id: 's3', slotDate, startTime: '08:00', endTime: '08:30', status: 'AVAILABLE' };

    // initial fetchSlots -> include expired slot
    mockApiFetch.mockResolvedValueOnce({ slots: [slot] });
    // center hours
    mockApiFetch.mockResolvedValueOnce({ data: [{ _id: 'c3' }] });

    render(<SlotManagementPage />);

    // Click Expired tab
    const expiredTab = await screen.findByText('Expired');
    fireEvent.click(expiredTab);

    // Delete All Expired button should appear
    const delBtn = await screen.findByText(/Delete All Expired/i);
    expect(delBtn).toBeInTheDocument();

    // Open dialog
    fireEvent.click(delBtn);

    // Mock delete API call
    mockApiFetch.mockResolvedValueOnce({ success: true });
    // Click Delete All in dialog
    const dialogDelete = await screen.findByText('Delete All');
    fireEvent.click(dialogDelete);

    await waitFor(() => expect(screen.getByText(/All expired unbooked slots deleted/i)).toBeInTheDocument());
  });
});
