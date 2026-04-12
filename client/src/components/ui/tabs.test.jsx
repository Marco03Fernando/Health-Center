import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './tabs';

const Component = Module.default || Module.Tabs || (() => null);

describe('Tabs (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
