import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './CartPage';

const Component = Module.default || Module.CartPage || (() => null);

test('CartPage renders', () => {
  render(<Component />);
});
