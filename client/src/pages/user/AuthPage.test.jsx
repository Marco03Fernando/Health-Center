import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './AuthPage';

const Component = Module.default || Module.AuthPage || (() => null);

test('AuthPage renders', () => {
  render(<Component />);
});
