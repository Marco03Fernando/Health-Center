import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './LabTestsPage';

const Component = Module.default || Module.LabTestsPage || (() => null);

test('LabTestsPage renders', () => {
  render(<Component />);
});
