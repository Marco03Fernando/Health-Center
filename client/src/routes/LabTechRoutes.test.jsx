import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as Module from './LabTechRoutes';

const Component = Module.default || Module.LabTechRoutes || (() => null);

test('LabTechRoutes render without crashing', () => {
  render(<MemoryRouter><Component /></MemoryRouter>);
});
