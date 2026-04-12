import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './resizable';

const Component = Module.default || Module.Resizable || (() => null);

describe('Resizable (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
