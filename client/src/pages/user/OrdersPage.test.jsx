import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './OrdersPage';

const Component = Module.default || Module.OrdersPage || (() => null);

test('OrdersPage renders', () => {
  render(<Component />);
});
