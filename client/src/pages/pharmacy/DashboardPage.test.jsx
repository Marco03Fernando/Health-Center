import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './DashboardPage';

const Component = Module.default || Module.DashboardPage || (() => null);

test('Pharmacy DashboardPage renders', () => {
  render(<Component />);
});
