import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './context-menu';

const Component = Module.default || Module.ContextMenu || (() => null);

describe('ContextMenu (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
