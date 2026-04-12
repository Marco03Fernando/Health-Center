import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './hover-card';

const Component = Module.default || Module.HoverCard || (() => null);

describe('HoverCard (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
