import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './DoctorsPage';

const Component = Module.default || Module.DoctorsPage || (() => null);

test('DoctorsPage renders', () => {
  render(<Component />);
});
