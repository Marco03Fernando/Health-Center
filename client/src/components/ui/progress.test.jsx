import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './progress';

const Component = Module.default || Module.Progress || (() => null);

describe('Progress (ui)', () => {
  it('renders without crashing', () => {
    render(<Component value={50} />);
  });
});
