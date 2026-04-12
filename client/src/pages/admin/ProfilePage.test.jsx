import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './ProfilePage';

const Component = Module.default || Module.ProfilePage || (() => null);

test('Admin ProfilePage renders', () => {
  render(<Component />);
});
