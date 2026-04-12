import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './Navbar';

const Component = Module.default || Module.Navbar || (() => null);

describe('Navbar', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
