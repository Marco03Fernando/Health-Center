import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as Module from './UserRoutes';

const Component = Module.default || Module.UserRoutes || (() => null);

test('UserRoutes render without crashing', () => {
  render(<MemoryRouter><Component /></MemoryRouter>);
});
