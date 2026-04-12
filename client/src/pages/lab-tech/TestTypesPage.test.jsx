import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './TestTypesPage';

const Component = Module.default || Module.TestTypesPage || (() => null);

test('TestTypesPage renders', () => {
  render(<Component />);
});
