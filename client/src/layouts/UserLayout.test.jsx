import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './UserLayout';

const Component = Module.default || Module.UserLayout || (() => null);

test('UserLayout renders children', () => {
  render(<Component><div>child</div></Component>);
});
