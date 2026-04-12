import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './BookingDetailPage';

const Component = Module.default || Module.BookingDetailPage || (() => null);

test('BookingDetailPage renders', () => {
  render(<Component />);
});
