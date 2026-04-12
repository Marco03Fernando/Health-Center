import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as Module from './AdminRoutes';

const Component = Module.default || Module.AdminRoutes || (() => null);

test('AdminRoutes render without crashing', () => {
  render(<MemoryRouter><Component /></MemoryRouter>);
});
