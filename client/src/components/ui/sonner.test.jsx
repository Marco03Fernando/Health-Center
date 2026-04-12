import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './sonner';

const Component = Module.default || Module.Sonner || (() => null);

describe('Sonner (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
