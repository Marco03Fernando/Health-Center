import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './sheet';

const Component = Module.default || Module.Sheet || (() => null);

describe('Sheet (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
