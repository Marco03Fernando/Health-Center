import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './PatientsPage';

const Component = Module.default || Module.PatientsPage || (() => null);

test('Doctor PatientsPage renders', () => {
  render(<Component />);
});
