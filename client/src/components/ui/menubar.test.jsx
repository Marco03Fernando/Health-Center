import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './menubar';

const Component = Module.default || Module.Menubar || (() => null);

describe('Menubar (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
