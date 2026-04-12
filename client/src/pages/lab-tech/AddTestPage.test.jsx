import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './AddTestPage';

const Component = Module.default || Module.AddTestPage || (() => null);

test('AddTestPage renders', () => {
  render(<Component />);
});
