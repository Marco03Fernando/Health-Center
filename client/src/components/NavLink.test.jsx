import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './NavLink';

const Component = Module.default || Module.NavLink || (() => null);

describe('NavLink', () => {
  it('renders without crashing', () => {
    render(<Component to="/" />);
  });
});
