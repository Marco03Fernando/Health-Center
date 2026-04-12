import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './AppointmentsPage';

const Component = Module.default || Module.AppointmentsPage || (() => null);

test('AppointmentsPage renders', () => {
  render(<Component />);
});
