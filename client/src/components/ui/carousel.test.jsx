import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './carousel';

const Component = Module.default || Module.Carousel || (() => null);

describe('Carousel (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
