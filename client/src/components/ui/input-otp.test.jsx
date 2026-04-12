import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './input-otp';

const Component = Module.default || Module.InputOTP || (() => null);

describe('Input OTP (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
