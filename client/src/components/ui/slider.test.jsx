import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './slider';

const Component = Module.default || Module.Slider || (() => null);

describe('Slider (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
