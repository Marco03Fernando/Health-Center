import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Module from './CenterInfoPage';

const Component = Module.default || Module.CenterInfoPage || (() => null);

test('CenterInfoPage renders', () => {
  // ensure context default to avoid destructuring errors
  const { useCenterAdmin } = require('@/contexts/CenterAdminContext');
  useCenterAdmin.mockReturnValue({ centerId: null });
  render(<Component />);
});

// Reuse and mock existing context and api modules to test realistic flows
jest.mock('@/contexts/CenterAdminContext', () => ({
  useCenterAdmin: jest.fn(),
}));
jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(),
}));

const { useCenterAdmin } = require('@/contexts/CenterAdminContext');
const { apiFetch } = require('@/lib/api');

describe('CenterInfoPage — behavior', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('shows loader initially and then displays center details on success', async () => {
    useCenterAdmin.mockReturnValue({ centerId: 'c1' });

    const center = {
      _id: 'c1',
      name: 'My Center',
      isActive: true,
      isFeatured: true,
      address: '123 Road',
      district: 'District 9',
      phone: '0771234567',
      openingTime: '09:00',
      closingTime: '17:00',
      createdAt: '2020-01-01T00:00:00.000Z',
    };

    // First call returns admin/all list containing the center
    apiFetch.mockResolvedValueOnce({ data: [center] });

    render(<Component />);

    // Wait for the center name to appear (may appear in multiple places)
    const matches = await screen.findAllByText('My Center');
    expect(matches.length).toBeGreaterThanOrEqual(1);

    // Badges and phone should be visible
    expect(screen.getByText(/Active/i)).toBeInTheDocument();
    expect(screen.getByText(/Featured/i)).toBeInTheDocument();
    expect(screen.getByText('0771234567')).toBeInTheDocument();
  });

  test('shows fallback no-center message when centerId is not set', () => {
    useCenterAdmin.mockReturnValue({ centerId: null });
    render(<Component />);

    expect(screen.getByText(/No center information available/i)).toBeInTheDocument();
    expect(screen.getByText(/Your account may not be linked to a center yet/i)).toBeInTheDocument();
  });

  test('displays error message when apiFetch throws', async () => {
    useCenterAdmin.mockReturnValue({ centerId: 'c-error' });
    apiFetch.mockRejectedValueOnce(new Error('Network failure'));

    render(<Component />);

    // Wait for the error text to appear
    expect(await screen.findByText(/Network failure/i)).toBeInTheDocument();
  });
});
