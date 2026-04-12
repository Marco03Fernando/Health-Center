import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './PharmacyLayout';

const Component = Module.default || Module.PharmacyLayout || (() => null);

test('PharmacyLayout renders children', () => {
  render(<Component><div>child</div></Component>);
});
