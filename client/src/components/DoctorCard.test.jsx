import React from 'react';
import { render, screen } from '@testing-library/react';
import * as Module from './DoctorCard';

const Component = Module.default || Module.DoctorCard || (() => null);

const mockDoctor = {
  id: '1',
  avatar: '\ud83d\udc68\u200d\u2695\ufe0f',
  name: 'Dr. Smith',
  specialization: 'Cardiology',
  clinic: 'Test Clinic',
  rating: 4.5,
  availability: ['Mon', 'Wed', 'Fri'],
  experience: '5 years',
  fee: 1500,
};

describe('DoctorCard', () => {
  it('renders without crashing', () => {
    render(<Component doctor={mockDoctor} />);
  });

  it('displays the doctor name', () => {
    render(<Component doctor={mockDoctor} />);
    expect(screen.getByText('Dr. Smith')).toBeTruthy();
  });
});
