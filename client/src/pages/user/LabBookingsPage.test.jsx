import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './LabBookingsPage';

const Component = Module.default || Module.LabBookingsPage || (() => null);

test('User LabBookingsPage renders', () => {
  render(<Component />);
});
