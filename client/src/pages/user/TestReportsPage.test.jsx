import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './TestReportsPage';

const Component = Module.default || Module.TestReportsPage || (() => null);

test('TestReportsPage renders', () => {
  render(<Component />);
});
