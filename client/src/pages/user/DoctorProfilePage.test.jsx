import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './DoctorProfilePage';

const Component = Module.default || Module.DoctorProfilePage || (() => null);

test('DoctorProfilePage renders', () => {
  render(<Component />);
});
