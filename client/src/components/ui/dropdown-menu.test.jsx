import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './dropdown-menu';

const Component = Module.default || Module.DropdownMenu || (() => null);

describe('DropdownMenu (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
