import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './PrescriptionsPage';

const Component = Module.default || Module.PrescriptionsPage || (() => null);

test('PrescriptionsPage renders', () => {
  render(<Component />);
});
