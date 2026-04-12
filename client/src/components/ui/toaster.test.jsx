import React from 'react';
import { render } from '@testing-library/react';
import { Toaster } from './toaster';

describe('Toaster (ui)', () => {
  it('renders without crashing', () => {
    render(<Toaster />);
  });
});
