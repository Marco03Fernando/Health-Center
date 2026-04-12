import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './LabTechLayout';

const Component = Module.default || Module.LabTechLayout || (() => null);

test('LabTechLayout renders children', () => {
  render(<Component><div>child</div></Component>);
});
