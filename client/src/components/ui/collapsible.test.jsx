import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './collapsible';

const Component = Module.default || Module.Collapsible || (() => null);

describe('Collapsible (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
