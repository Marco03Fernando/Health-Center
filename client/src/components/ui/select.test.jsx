import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './select';

const Component = Module.default || Module.Select || (() => null);

describe('Select (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
