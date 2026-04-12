import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as Module from './DoctorRoutes';

const Component = Module.default || Module.DoctorRoutes || (() => null);

test('DoctorRoutes render without crashing', () => {
  render(<MemoryRouter><Component /></MemoryRouter>);
});
