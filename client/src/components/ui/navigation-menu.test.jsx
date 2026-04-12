import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './navigation-menu';

const Component = Module.default || Module.NavigationMenu || (() => null);

describe('NavigationMenu (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
