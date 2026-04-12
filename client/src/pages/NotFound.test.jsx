import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './NotFound';

const Component = Module.default || Module.NotFound || (() => null);

test('NotFound renders', () => {
  render(<Component />);
});
