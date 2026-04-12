import React from 'react';
import { render, screen } from '@testing-library/react';
import * as Module from './AppointmentCard';

const Component = Module.default || Module.AppointmentCard || (() => null);

const mockAppointment = {
  id: '1',
  doctorName: 'Dr. Smith',
  specialization: 'Cardiology',
  status: 'confirmed',
  clinic: 'Test Clinic',
  date: '2024-01-01',
  time: '10:00 AM',
  fee: 1000,
};

describe('AppointmentCard', () => {
  it('renders without crashing', () => {
    render(<Component appointment={mockAppointment} onCancel={jest.fn()} />);
  });

  it('displays the doctor name', () => {
    render(<Component appointment={mockAppointment} onCancel={jest.fn()} />);
    expect(screen.getByText('Dr. Smith')).toBeTruthy();
  });
});
