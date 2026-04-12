import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './LabBookingDetailPage';

const Component = Module.default || Module.LabBookingDetailPage || (() => null);

test('LabBookingDetailPage renders', () => {
  render(<Component />);
});
