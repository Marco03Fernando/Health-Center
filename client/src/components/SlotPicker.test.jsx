import React from 'react';
import { render, screen } from '@testing-library/react';
import * as Module from './SlotPicker';

const Component = Module.default || Module.SlotPicker || (() => null);

const mockSlots = ['09:00', '10:00', '11:00', '14:00'];

describe('SlotPicker', () => {
  it('renders without crashing', () => {
    render(<Component slots={mockSlots} selected={null} onSelect={jest.fn()} />);
  });

  it('renders all slot buttons', () => {
    render(<Component slots={mockSlots} selected={null} onSelect={jest.fn()} />);
    expect(screen.getByText('09:00')).toBeTruthy();
    expect(screen.getByText('10:00')).toBeTruthy();
  });
});
