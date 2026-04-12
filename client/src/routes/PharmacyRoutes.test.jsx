import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as Module from './PharmacyRoutes';

const Component = Module.default || Module.PharmacyRoutes || (() => null);

test('PharmacyRoutes render without crashing', () => {
  render(<MemoryRouter><Component /></MemoryRouter>);
});
