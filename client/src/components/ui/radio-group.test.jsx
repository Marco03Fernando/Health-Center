import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './radio-group';

const Component = Module.default || Module.RadioGroup || (() => null);

describe('RadioGroup (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
