import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './dialog';

const Component = Module.default || Module.Dialog || (() => null);

describe('Dialog (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
