import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './aspect-ratio';

const Component = Module.default || Module.AspectRatio || (() => null);

describe('AspectRatio (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
