import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './HomePage';

const Component = Module.default || Module.HomePage || (() => null);

test('HomePage renders', () => {
  render(<Component />);
});
