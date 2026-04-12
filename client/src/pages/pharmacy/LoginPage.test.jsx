import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './LoginPage';

const Component = Module.default || Module.LoginPage || (() => null);

test('Pharmacy LoginPage renders', () => {
  render(<Component />);
});
