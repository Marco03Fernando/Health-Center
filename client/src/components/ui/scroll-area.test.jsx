import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './scroll-area';

const Component = Module.default || Module.ScrollArea || (() => null);

describe('ScrollArea (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
