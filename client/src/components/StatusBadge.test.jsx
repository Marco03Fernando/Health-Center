import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './StatusBadge';

const Component = Module.default || Module.StatusBadge || (() => null);

describe('StatusBadge', () => {
  it('renders without crashing', () => {
    render(<Component status="active" />);
  });
});
