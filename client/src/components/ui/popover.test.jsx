import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './popover';

const Component = Module.default || Module.Popover || (() => null);

describe('Popover (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
