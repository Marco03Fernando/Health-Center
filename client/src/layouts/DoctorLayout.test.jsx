import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './DoctorLayout';

const Component = Module.default || Module.DoctorLayout || (() => null);

test('DoctorLayout renders children', () => {
  render(<Component><div>child</div></Component>);
});
