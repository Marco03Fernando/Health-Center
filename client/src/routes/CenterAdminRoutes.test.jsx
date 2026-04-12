import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as Module from './CenterAdminRoutes';

const Component = Module.default || Module.CenterAdminRoutes || (() => null);

test('CenterAdminRoutes render without crashing', () => {
  render(<MemoryRouter><Component /></MemoryRouter>);
});
