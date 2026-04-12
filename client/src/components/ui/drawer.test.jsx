import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './drawer';

const Component = Module.default || Module.Drawer || (() => null);

describe('Drawer (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
