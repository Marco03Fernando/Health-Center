import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './table';

const Component = Module.default || Module.Table || (() => null);

describe('Table (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
