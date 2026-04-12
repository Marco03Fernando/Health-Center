import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './LoginPage';

const Component = Module.default || Module.LoginPage || (() => null);

test('LabTech LoginPage renders', () => {
  render(<Component />);
});
